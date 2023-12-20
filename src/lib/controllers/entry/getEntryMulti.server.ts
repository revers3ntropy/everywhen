import type { Auth } from '$lib/controllers/auth/auth.server';
import type { EntryEdit, EntryFilter, RawEntry } from '$lib/controllers/entry/entry';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Label } from '$lib/controllers/label/label.server';
import { Location } from '$lib/controllers/location/location.server';
import { query } from '$lib/db/mysql.server';
import { decrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import type { Day } from '$lib/utils/time';

export async function all(auth: Auth, filter: EntryFilter = {}): Promise<Result<Entry[]>> {
    let location: Location | null = null;
    if (filter.locationId) {
        const locationResult = await Location.fromId(auth, filter.locationId);
        if (!locationResult.ok) return locationResult.cast();
        location = locationResult.val;
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

        return (await entriesFromRaw(auth, rawEntries)).map(entries => [entries, totalCount]);
    }

    const start = offset;
    const end = start + count;
    return (await all(auth, filter)).map(entries => {
        const filtered = filterEntriesBySearchTerm(entries, filter.search || '');
        return [filtered.slice(start, end), filtered.length];
    });
}

export async function onDay(auth: Auth, day: Day): Promise<Result<Entry[]>> {
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
        WHERE deleted IS NULL
          AND userId = ${auth.id}
          AND DATE_FORMAT(FROM_UNIXTIME(created + createdTzOffset * 60 * 60), '%Y-%m-%d') = ${day.fmtIso()}
        ORDER BY created DESC, id
    `;
    // TODO: use index on 'created' with large buffer around day's timestamp to reduce DB reads

    return await entriesFromRaw(auth, rawEntries);
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

    const labels = await Label.allIndexedById(auth);
    if (!labels.ok) return labels.cast();

    const edits = Result.collect(rawEdits.map(e => Entry.editFromRaw(auth, labels.val, e)));
    if (!edits.ok) return edits.cast();

    const groupedEdits = edits.val.reduce(
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
            const decryptedTitle = decrypt(rawEntry.title, auth.key);
            if (!decryptedTitle.ok) return decryptedTitle.cast();

            const decryptedBody = decrypt(rawEntry.body, auth.key);
            if (!decryptedBody.ok) return decryptedBody.cast();

            let decryptedAgentData = '';
            if (rawEntry.agentData) {
                const res = decrypt(rawEntry.agentData, auth.key);
                if (!res.ok) return res.cast();
                decryptedAgentData = res.val;
            }

            return Result.ok({
                id: rawEntry.id,
                title: decryptedTitle.val,
                body: decryptedBody.val,
                created: rawEntry.created,
                createdTzOffset: rawEntry.createdTzOffset,
                deleted: rawEntry.deleted,
                pinned: rawEntry.pinned,
                latitude: rawEntry.latitude,
                longitude: rawEntry.longitude,
                agentData: decryptedAgentData,
                wordCount: rawEntry.wordCount,
                label: labels.val[rawEntry?.labelId || ''] || null,
                edits: groupedEdits[rawEntry.id] ?? []
            });
        })
    );
}
