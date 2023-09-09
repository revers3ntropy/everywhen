import type { Auth } from '$lib/controllers/auth/auth.server';
import type { EntryEdit, EntryFilter, RawEntry } from '$lib/controllers/entry/entry';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Label } from '$lib/controllers/label/label.server';
import { Location } from '$lib/controllers/location/location.server';
import { query } from '$lib/db/mysql.server';
import { decrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';

export async function all(auth: Auth, filter: EntryFilter = {}): Promise<Result<Entry[]>> {
    let location = null as Location | null;
    if (filter.locationId) {
        const locationResult = await Location.fromId(auth, filter.locationId);
        if (locationResult.err) return Result.err(locationResult.err);
        location = locationResult.val;
    }
    if (filter.onlyWithLocation && location) {
        return Result.err(
            'Cannot both filter out all entries with a location and filter by location'
        );
    }

    const rawEntries = await query<
        {
            id: string;
            created: number;
            createdTzOffset: number;
            title: string;
            deleted: number | null;
            pinned: number | null;
            labelId: string | null;
            body: string;
            latitude: number | null;
            longitude: number | null;
            agentData: string;
            wordCount: number;
        }[]
    >`
        SELECT id,
               created,
               createdTzOffset,
               title,
               deleted,
               pinned,
               labelId,
               body,
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
                (labelId = ${filter.labelId || ''})
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
            AND userId = ${auth.id}
        ORDER BY created DESC, id
    `;

    if (location) {
        return await entriesFromRaw(
            auth,
            Location.filterByCirclePrecise(
                rawEntries,
                location.latitude,
                location.longitude,
                Location.degreesToMeters(location.radius)
            )
        );
    }
    return await entriesFromRaw(auth, rawEntries);
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
        const rawEntries = await query<
            {
                id: string;
                created: number;
                createdTzOffset: number;
                title: string;
                pinned: number | null;
                deleted: number | null;
                labelId: string | null;
                body: string;
                latitude: number | null;
                longitude: number | null;
                agentData: string;
                wordCount: number;
            }[]
        >`
            SELECT id,
                   created,
                   createdTzOffset,
                   title,
                   pinned,
                   deleted,
                   labelId,
                   body,
                   latitude,
                   longitude,
                   agentData,
                   wordCount
            FROM entries
            WHERE (
                (deleted IS NULL = ${!filter.deleted})
                OR ${filter.deleted === 'both'}
              )
              AND (labelId = ${filter.labelId || ''} OR ${filter.labelId === undefined})
              AND userId = ${auth.id}
            ORDER BY created DESC, id
            LIMIT ${count}
            OFFSET ${offset}
        `;

        const { val: entries, err } = await entriesFromRaw(auth, rawEntries);
        if (err) return Result.err(err);

        const [{ totalCount }] = await query<{ totalCount: number }[]>`
            SELECT COUNT(*) as totalCount
            FROM entries
            WHERE (
                (deleted IS NULL = ${!filter.deleted})
                OR ${filter.deleted === 'both'}
              )
              AND (labelId = ${filter.labelId || ''} OR ${filter.labelId === undefined})
              AND userId = ${auth.id}
        `;

        return Result.ok([entries, totalCount]);
    }

    const start = offset;
    const end = start + count;
    const { val: entries, err } = await all(auth, filter);
    if (err) return Result.err(err);

    const filtered = filterEntriesBySearchTerm(entries, filter.search || '');

    return Result.ok([filtered.slice(start, end), filtered.length]);
}

export async function near(
    auth: Auth,
    location: Location,
    deleted: boolean | 'both' = false
): Promise<Result<Entry[]>> {
    const raw = await query<
        {
            id: string;
            created: number;
            createdTzOffset: number;
            deleted: number | null;
            pinned: number | null;
            latitude: number | null;
            longitude: number | null;
            title: string;
            body: string;
            labelId: string | null;
            agentData: string;
            wordCount: number;
        }[]
    >`
        SELECT id,
               created,
               createdTzOffset,
               deleted,
               pinned,
               latitude,
               longitude,
               title,
               body,
               labelId,
               agentData,
               wordCount
        FROM entries
        WHERE (
            (deleted IS NULL = ${!deleted})
            OR ${deleted === 'both'}
        )
        AND userId = ${auth.id}
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND SQRT(
            POW(latitude - ${location.latitude}, 2)
            + POW(longitude - ${location.longitude}, 2)
        ) <= ${location.radius}
    `;
    return await entriesFromRaw(auth, raw);
}

function filterEntriesBySearchTerm(entries: Entry[], searchTerm: string): Entry[] {
    if (!searchTerm) return entries;

    searchTerm = searchTerm.toLowerCase();
    return entries.filter(
        e => e.title.toLowerCase().includes(searchTerm) || e.body.toLowerCase().includes(searchTerm)
    );
}

async function entriesFromRaw(auth: Auth, raw: RawEntry[]): Promise<Result<Entry[]>> {
    const rawEdits = await query<
        {
            id: string;
            entryId: string;
            created: number;
            createdTzOffset: number;
            latitude: number | null;
            longitude: number | null;
            agentData: string;
            oldTitle: string;
            oldBody: string;
            oldLabelId: string | null;
        }[]
    >`
        SELECT
            id,
            entryId,
            created,
            createdTzOffset,
            latitude,
            longitude,
            agentData,
            oldTitle,
            oldBody,
            oldLabelId
        FROM entryEdits
        WHERE entryEdits.userId = ${auth.id}
    `;

    const { err, val: labels } = await Label.allIndexedById(auth);
    if (err) return Result.err(err);

    const { err: editsErr, val: edits } = Result.collect(
        rawEdits.map(e => Entry.editFromRaw(auth, labels, e))
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

    return Result.collect(
        raw.map(rawEntry => {
            const { err: titleErr, val: decryptedTitle } = decrypt(rawEntry.title, auth.key);
            if (titleErr) return Result.err(titleErr);

            const { err: bodyErr, val: decryptedBody } = decrypt(rawEntry.body, auth.key);
            if (bodyErr) return Result.err(bodyErr);

            let decryptedAgentData = '';
            if (rawEntry.agentData) {
                const { err: agentErr, val } = decrypt(rawEntry.agentData, auth.key);
                if (agentErr) return Result.err(agentErr);
                decryptedAgentData = val;
            }

            return Result.ok({
                id: rawEntry.id,
                title: decryptedTitle,
                body: decryptedBody,
                created: rawEntry.created,
                createdTzOffset: rawEntry.createdTzOffset,
                deleted: rawEntry.deleted,
                pinned: rawEntry.pinned,
                latitude: rawEntry.latitude,
                longitude: rawEntry.longitude,
                agentData: decryptedAgentData,
                wordCount: rawEntry.wordCount,
                label: labels[rawEntry?.labelId || ''] || null,
                edits: groupedEdits[rawEntry.id] ?? []
            });
        })
    );
}
