import type { Auth } from '$lib/controllers/auth/auth.server';
import type { EntryEdit, EntryFilter, RawEntry } from '$lib/controllers/entry/entry';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Label } from '$lib/controllers/label/label.server';
import { Location } from '$lib/controllers/location/location.server';
import { query } from '$lib/db/mysql.server';
import type { Day } from '$lib/utils/day';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { normaliseWordForIndex, wordsFromText } from '$lib/utils/text';

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
              AND (labelId = ${filter.labelId || ''} OR ${!filter.labelId})
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

    if (filter.search && !filter.locationId) {
        return await searchPaginated(auth, filter.search, offset, count);
    }

    let entries;
    if (filter.search) {
        entries = await search(auth, filter.search);
    } else {
        entries = await all(auth, filter);
    }
    if (!entries.ok) return entries.cast();

    const start = offset;
    const end = start + count;

    if (!filter.locationId) return Result.ok([entries.val.slice(start, end), entries.val.length]);

    const filteredByLocation = await Location.filterByLocationPrecise(
        auth,
        entries.val,
        filter.locationId
    );
    if (!filteredByLocation.ok) return filteredByLocation.cast();
    return Result.ok([
        filteredByLocation.val.slice(start, end),
        filteredByLocation.val.length
    ] as const);
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
            AND day = ${day.fmtIso()}
        ORDER BY created DESC, id
    `;

    return await entriesFromRaw(auth, rawEntries);
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

export async function search(auth: Auth, queryString: string): Promise<Result<Entry[]>> {
    const queryStringParts = wordsFromText(queryString).map(normaliseWordForIndex);
    if (queryStringParts.length === 0) return Result.ok([]);
    const encryptedWords = queryStringParts.map(word => encrypt(word, auth.key));

    const entries = await query<
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
            SELECT DISTINCT (entries.id),
                   entries.created,
                   entries.createdTzOffset,
                   entries.title,
                   entries.pinned,
                   entries.deleted,
                   entries.labelId,
                   entries.body,
                   entries.latitude,
                   entries.longitude,
                   entries.agentData,
                   entries.wordCount
        FROM entries, wordsInEntries WHERE
            entries.id = wordsInEntries.entryId AND
            wordsInEntries.word IN (${encryptedWords}) AND
            entries.userId = ${auth.id}
       ORDER BY created DESC, id
    `;

    return await entriesFromRaw(auth, entries);
}

export async function searchPaginated(
    auth: Auth,
    queryString: string,
    offset: number,
    count: number
): Promise<Result<[Entry[], number]>> {
    const queryStringParts = wordsFromText(queryString).map(normaliseWordForIndex).filter(Boolean);
    if (queryStringParts.length === 0) return Result.ok([[], 0]);
    const encryptedWords = queryStringParts.map(word => encrypt(word, auth.key));

    const entries = await query<
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
            SELECT DISTINCT (entries.id),
                   entries.created,
                   entries.createdTzOffset,
                   entries.title,
                   entries.pinned,
                   entries.deleted,
                   entries.labelId,
                   entries.body,
                   entries.latitude,
                   entries.longitude,
                   entries.agentData,
                   entries.wordCount
        FROM entries, wordsInEntries WHERE
            entries.id = wordsInEntries.entryId AND
            wordsInEntries.word IN (${encryptedWords}) AND
            entries.userId = ${auth.id}
        ORDER BY created DESC, id
        LIMIT ${count}
        OFFSET ${offset}
    `;

    const [{ totalCount }] = await query<{ totalCount: number }[]>`
        SELECT COUNT(DISTINCT entries.id) as totalCount
        FROM entries, wordsInEntries WHERE
            entries.id = wordsInEntries.entryId AND
            wordsInEntries.word IN (${encryptedWords}) AND
            entries.userId = ${auth.id}
    `;

    return (await entriesFromRaw(auth, entries)).map(e => [e, totalCount]);
}
