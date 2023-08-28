import type { Auth } from '$lib/controllers/auth/auth.server';
import type { EntryEdit, EntryFilter, RawEntry } from '$lib/controllers/entry/entry';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Label } from '$lib/controllers/label/label.server';
import { Location } from '$lib/controllers/location/location';
import { query } from '$lib/db/mysql.server';
import { decrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';

export async function getTitles(auth: Auth): Promise<Result<Entry[]>> {
    const { val: entries, err } = await all(auth);
    if (err) return Result.err(err);
    return Result.ok(entries.map(Entry.entryToTitleEntry));
}

export async function all(auth: Auth, filter: EntryFilter = {}): Promise<Result<Entry[]>> {
    let location = null as Location | null;
    if (filter.locationId) {
        const locationResult = await Location.fromId(query, auth, filter.locationId);
        if (locationResult.err) return Result.err(locationResult.err);
        location = locationResult.val;
    }
    if (filter.onlyWithLocation && location) {
        return Result.err(
            'Cannot both filter out all entries with a location and filter by location'
        );
    }

    const rawEntries = await query<RawEntry[]>`
        SELECT id,
               created,
               createdTZOffset,
               title,
               deleted,
               pinned,
               label,
               entry,
               latitude,
               longitude,
               agentData,
               wordCount
        FROM entries
        WHERE (
                (deleted IS NULL = ${!filter.deleted})
                OR ${filter.deleted === 'both'}
            )
            AND (
                (label = ${filter.labelId || ''})
                OR ${filter.labelId === undefined}
            )
            AND (
              ${!filter.onlyWithLocation} 
              OR (latitude IS NOT NULL AND longitude IS NOT NULL)
            )
            AND (
                ${!location} OR (
                    latitude IS NOT NULL
                    AND longitude IS NOT NULL
                    AND SQRT(
                            POW(latitude - ${location?.latitude || 0}, 2)
                            + POW(longitude - ${location?.longitude || 0}, 2)
                    ) <= ${(location?.radius || 0) * 2}
                )
            )
            AND user = ${auth.id}
        ORDER BY created DESC, id
    `;

    if (location) {
        return await fromRawMulti(
            auth,
            Location.filterByCirclePrecise(
                rawEntries,
                location.latitude,
                location.longitude,
                Location.degreesToMeters(location.radius)
            )
        );
    }
    return await fromRawMulti(auth, rawEntries);
}

export async function getPage(
    auth: Auth,
    offset: number,
    count: number,
    filter: EntryFilter = {}
): Promise<Result<[Entry[], number]>> {
    if (!filter.locationId && !filter.search) {
        // if there is no location and no search term (very common query),
        // do much faster query without the location check or filtering post-decryption
        const rawEntries = await query<RawEntry[]>`
            SELECT id,
                   created,
                   createdTZOffset,
                   title,
                   pinned,
                   deleted,
                   label,
                   entry,
                   latitude,
                   longitude,
                   agentData,
                   wordCount
            FROM entries
            WHERE (           
                (deleted IS NULL = ${!filter.deleted})
                OR ${filter.deleted === 'both'}
              )
              AND (label = ${filter.labelId || ''} OR ${filter.labelId === undefined})
              AND user = ${auth.id}
            ORDER BY created DESC, id
            LIMIT ${count}
            OFFSET ${offset}
        `;

        const { val: entries, err } = await fromRawMulti(auth, rawEntries);
        if (err) return Result.err(err);

        const [{ totalCount }] = await query<{ totalCount: number }[]>`
            SELECT COUNT(*) as totalCount 
            FROM entries
            WHERE (
                (deleted IS NULL = ${!filter.deleted})
                OR ${filter.deleted === 'both'}
                )
                AND (label = ${filter.labelId || ''} OR ${filter.labelId === undefined})
                AND user = ${auth.id}
        `;

        return Result.ok([entries, totalCount]);
    }

    const start = offset;
    const end = start + count;
    const { val: entries, err } = await all(auth, filter);
    if (err) return Result.err(err);

    return Result.ok([
        filterEntriesBySearchTerm(entries, filter.search || '').slice(start, end),
        entries.length
    ]);
}

export async function near(
    auth: Auth,
    location: Location,
    deleted: boolean | 'both' = false
): Promise<Result<Entry[]>> {
    const raw = await query<RawEntry[]>`
        SELECT id,
               created,
               createdTZOffset,
               deleted,
               pinned,
               latitude,
               longitude,
               title,
               entry,
               label,
               agentData,
               wordCount
        FROM entries
        WHERE (
            (deleted IS NULL = ${!deleted})
            OR ${deleted === 'both'}
        )
        AND user = ${auth.id}
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND SQRT(
            POW(latitude - ${location.latitude}, 2)
            + POW(longitude - ${location.longitude}, 2)
        ) <= ${location.radius}
    `;
    return await fromRawMulti(auth, raw);
}

function filterEntriesBySearchTerm(entries: Entry[], searchTerm: string): Entry[] {
    if (!searchTerm) return entries;

    searchTerm = searchTerm.toLowerCase();
    return entries.filter(
        e =>
            e.title.toLowerCase().includes(searchTerm) || e.entry.toLowerCase().includes(searchTerm)
    );
}

async function fromRawMulti(auth: Auth, raw: RawEntry[]): Promise<Result<Entry[]>> {
    const rawEdits = await query<(RawEntry & { entryId: string })[]>`
        SELECT entryEdits.created,
               entryEdits.entryId,
               entryEdits.createdTZOffset,
               entryEdits.latitude,
               entryEdits.longitude,
               entryEdits.title,
               entryEdits.entry,
               entryEdits.label,
               entryEdits.agentData
        FROM entryEdits,
             entries
        WHERE entries.user = ${auth.id}
          AND entries.id = entryEdits.entryId
    `;

    const { err, val: labels } = await Label.Server.all(auth);
    if (err) return Result.err(err);

    const { err: editsErr, val: edits } = await Result.collectAsync(
        rawEdits.map(async e => await Entry.Server.fromRawEdit(auth, labels, e))
    );
    if (editsErr) return Result.err(editsErr);

    const groupedEdits = edits.reduce(
        (prev, edit) => {
            if (!edit.entryId) return prev;
            prev[edit.entryId] ??= [];
            prev[edit.entryId].push(edit);
            return prev;
        },
        {} as Record<string, EntryEdit[]>
    );

    const groupedLabels = labels.reduce<Record<string, Label>>((prev, label) => {
        prev[label.id] = label;
        return prev;
    }, {});

    return Result.collect(
        raw.map(rawEntry => {
            const { err: titleErr, val: decryptedTitle } = decrypt(rawEntry.title, auth.key);
            if (titleErr) return Result.err(titleErr);

            const { err: entryErr, val: decryptedEntry } = decrypt(rawEntry.entry, auth.key);
            if (entryErr) return Result.err(entryErr);

            let decryptedAgentData = '';
            if (rawEntry.agentData) {
                const { err: agentErr, val } = decrypt(rawEntry.agentData, auth.key);
                if (agentErr) return Result.err(agentErr);
                decryptedAgentData = val;
            }

            return Result.ok({
                id: rawEntry.id,
                title: decryptedTitle,
                entry: decryptedEntry,
                created: rawEntry.created,
                createdTZOffset: rawEntry.createdTZOffset,
                deleted: rawEntry.deleted,
                pinned: rawEntry.pinned,
                latitude: rawEntry.latitude,
                longitude: rawEntry.longitude,
                agentData: decryptedAgentData,
                wordCount: rawEntry.wordCount,
                label: rawEntry.label ? groupedLabels[rawEntry.label] : null,
                edits: groupedEdits[rawEntry.id]
            });
        })
    );
}
