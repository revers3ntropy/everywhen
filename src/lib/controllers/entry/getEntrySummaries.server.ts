import type { Auth } from '$lib/controllers/auth/auth.server';
import type { EntrySummary, RawEntrySummary } from '$lib/controllers/entry/entry';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Label } from '$lib/controllers/label/label.server';
import { query } from '$lib/db/mysql.server';
import { decrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
import type { Hours, TimestampSecs } from '../../../types';

export async function getSummariesNYearsAgo(
    auth: Auth
): Promise<Result<Record<string, EntrySummary[]>>> {
    const earliestEntry = await query<{ created: TimestampSecs; createdTzOffset: Hours }[]>`
        SELECT created, createdTzOffset
        FROM entries
        WHERE userId = ${auth.id} 
          AND deleted IS NULL
        ORDER BY created
        LIMIT 1
    `;
    if (earliestEntry.length === 0) return Result.ok({});
    const earliestEntryYear = parseInt(
        fmtUtc(earliestEntry[0].created, earliestEntry[0].createdTzOffset, 'YYYY')
    );
    const numYearsBack = parseInt(fmtUtc(nowUtc(), currentTzOffset(), 'YYYY')) - earliestEntryYear;

    const dates = Array.from({ length: numYearsBack }, (_, i) => i + earliestEntryYear).map(
        y => `${y}-${fmtUtc(nowUtc(), 0, 'MM-DD')}`
    );

    if (dates.length === 0) return Result.ok({});

    const rawEntries = await query<
        {
            id: string;
            title: string;
            body: string;
            created: number;
            createdTzOffset: number;
            labelId: string | null;
            pinned: number | null;
            latitude: number | null;
            longitude: number | null;
            agentData: string;
            wordCount: number;
            editCount: number;
        }[]
    >`
        SELECT
            entries.id,
            entries.title,
            entries.body,
            entries.created,
            entries.createdTzOffset,
            entries.labelId,
            entries.pinned,
            entries.latitude,
            entries.longitude,
            entries.agentData,
            entries.wordCount,
            COUNT(entryEdits.id) as editCount
        FROM entries
        LEFT JOIN entryEdits ON entries.id = entryEdits.entryId
        WHERE deleted IS NULL
            AND entries.userId = ${auth.id}
            AND DATE_FORMAT(FROM_UNIXTIME(entries.created + entries.createdTzOffset * 60 * 60), '%Y-%m-%d')
                in (${dates})
        GROUP BY
            entries.id,
            entries.title,
            entries.body,
            entries.created,
            entries.createdTzOffset,
            entries.labelId,
            entries.pinned,
            entries.latitude,
            entries.longitude,
            entries.agentData,
            entries.wordCount
        ORDER BY entries.created DESC, id
    `;

    const { val: summaries, err } = await summariesFromRaw(auth, rawEntries);
    if (err) return Result.err(err);

    return Result.ok(
        dates.reduce(
            (prev, date) => {
                prev[date] = summaries.filter(
                    s => fmtUtc(s.created, s.createdTzOffset, 'YYYY-MM-DD') === date
                );
                return prev;
            },
            {} as Record<string, EntrySummary[]>
        )
    );
}

export async function getPageOfSummaries(
    auth: Auth,
    count: number,
    offset: number
): Promise<Result<{ summaries: EntrySummary[]; totalCount: number }>> {
    if (count < 1 || offset < 0 || isNaN(count) || isNaN(offset)) {
        return Result.err('Invalid entry title count/offset');
    }
    const rawEntries = await query<
        {
            id: string;
            title: string;
            body: string;
            created: number;
            createdTzOffset: number;
            labelId: string | null;
            pinned: number | null;
            latitude: number | null;
            longitude: number | null;
            agentData: string;
            wordCount: number;
            editCount: number;
        }[]
    >`
        SELECT
            entries.id,
            entries.title,
            entries.body,
            entries.created,
            entries.createdTzOffset,
            entries.labelId,
            entries.pinned,
            entries.latitude,
            entries.longitude,
            entries.agentData,
            entries.wordCount,
            COUNT(entryEdits.id) as editCount
        FROM entries
        LEFT JOIN entryEdits ON entries.id = entryEdits.entryId
        WHERE deleted IS NULL
            AND entries.userId = ${auth.id}
        GROUP BY
            entries.id,
            entries.title,
            entries.body,
            entries.created,
            entries.createdTzOffset,
            entries.labelId,
            entries.pinned,
            entries.latitude,
            entries.longitude,
            entries.agentData,
            entries.wordCount
        ORDER BY entries.created DESC, id
        LIMIT ${count}
        OFFSET ${offset}
    `;

    const { val: summaries, err } = await summariesFromRaw(auth, rawEntries);
    if (err) return Result.err(err);

    const [{ totalCount }] = await query<{ totalCount: number }[]>`
        SELECT COUNT(*) as totalCount 
        FROM entries
        WHERE deleted IS NULL
            AND entries.userId = ${auth.id}
    `;

    return Result.ok({ summaries, totalCount });
}

export async function getPinnedSummaries(auth: Auth): Promise<Result<EntrySummary[]>> {
    return await summariesFromRaw(
        auth,
        await query<
            {
                id: string;
                title: string;
                body: string;
                created: number;
                createdTzOffset: number;
                labelId: string | null;
                pinned: number | null;
                latitude: number | null;
                longitude: number | null;
                agentData: string;
                wordCount: number;
                editCount: number;
            }[]
        >`
        SELECT
            entries.id,
            entries.title,
            entries.body,
            entries.created,
            entries.createdTzOffset,
            entries.labelId,
            entries.pinned,
            entries.latitude,
            entries.longitude,
            entries.agentData,
            entries.wordCount,
            COUNT(entryEdits.id) as editCount
        FROM entries
        LEFT JOIN entryEdits ON entries.id = entryEdits.entryId
        WHERE deleted IS NULL
            AND entries.userId = ${auth.id}
            AND pinned IS NOT NULL
        GROUP BY
            entries.id,
            entries.title,
            entries.body,
            entries.created,
            entries.createdTzOffset,
            entries.labelId,
            entries.pinned,
            entries.latitude,
            entries.longitude,
            entries.agentData,
            entries.wordCount
        ORDER BY entries.created DESC, id
    `
    );
}

async function summariesFromRaw(
    auth: Auth,
    raw: RawEntrySummary[]
): Promise<Result<EntrySummary[]>> {
    const { err, val: labels } = await Label.Server.allIndexedById(auth);
    if (err) return Result.err(err);

    return Result.collect(
        raw.map(rawEntry => {
            const { err: titleErr, val: title } = decrypt(rawEntry.title, auth.key);
            if (titleErr) return Result.err(titleErr);
            const titleShortened = Entry.stringToShortTitle(title);

            const { err: bodyErr, val: body } = decrypt(rawEntry.body, auth.key);
            if (bodyErr) return Result.err(bodyErr);
            const bodyShortened = Entry.stringToShortTitle(body);

            const { err: agentErr, val: agentData } = decrypt(rawEntry.agentData, auth.key);
            if (agentErr) return Result.err(agentErr);

            return Result.ok({
                id: rawEntry.id,
                titleShortened,
                bodyShortened,
                created: rawEntry.created,
                createdTzOffset: rawEntry.createdTzOffset,
                pinned: rawEntry.pinned,
                latitude: rawEntry.latitude,
                longitude: rawEntry.longitude,
                agentData,
                wordCount: rawEntry.wordCount,
                label: rawEntry.labelId ? labels[rawEntry.labelId] : null,
                editCount: rawEntry.editCount
            });
        })
    );
}
