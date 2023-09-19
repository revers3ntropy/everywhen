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
    if (earliestEntry.length !== 1) return Result.ok({});
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
        }[]
    >`
        SELECT
            id,
            title,
            body,
            created,
            createdTzOffset,
            labelId,
            pinned,
            latitude,
            longitude,
            agentData,
            wordCount
        FROM entries
        WHERE deleted IS NULL
            AND userId = ${auth.id}
            AND DATE_FORMAT(FROM_UNIXTIME(created + createdTzOffset * 60 * 60), '%Y-%m-%d')
                in (${dates})
        ORDER BY created DESC, id
    `;

    const summariesRes = await summariesFromRaw(auth, rawEntries);
    if (!summariesRes.ok) return summariesRes.cast();

    return Result.ok(
        dates.reduce(
            (prev, date) => {
                const atDate = summariesRes.val.filter(
                    s => fmtUtc(s.created, s.createdTzOffset, 'YYYY-MM-DD') === date
                );
                if (atDate.length === 0) return prev;
                prev[date] = atDate;
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
        return Result.err('Invalid entry summary count/offset');
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
        }[]
    >`
        SELECT
            id,
            title,
            body,
            created,
            createdTzOffset,
            labelId,
            pinned,
            latitude,
            longitude,
            agentData,
            wordCount
        FROM entries
        WHERE deleted IS NULL
            AND userId = ${auth.id}
        ORDER BY created DESC, id
        LIMIT ${count}
        OFFSET ${offset}
    `;

    const summariesRes = await summariesFromRaw(auth, rawEntries);
    if (!summariesRes.ok) return summariesRes.cast();

    const [{ totalCount }] = await query<{ totalCount: number }[]>`
        SELECT COUNT(*) as totalCount 
        FROM entries
        WHERE deleted IS NULL
            AND entries.userId = ${auth.id}
    `;

    return Result.ok({ summaries: summariesRes.val, totalCount });
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
            }[]
        >`
            SELECT
                id,
                title,
                body,
                created,
                createdTzOffset,
                labelId,
                pinned,
                latitude,
                longitude,
                agentData,
                wordCount
            FROM entries
            WHERE deleted IS NULL
                AND userId = ${auth.id}
                AND pinned IS NOT NULL
            ORDER BY created DESC, id
        `
    );
}

async function summariesFromRaw(
    auth: Auth,
    raw: RawEntrySummary[]
): Promise<Result<EntrySummary[]>> {
    const labelsRes = await Label.allIndexedById(auth);
    if (!labelsRes.ok) return labelsRes.cast();

    return Result.collect(
        raw.map(rawEntry => {
            const titleRes = decrypt(rawEntry.title, auth.key);
            if (!titleRes.ok) return titleRes.cast();
            const titleShortened = Entry.stringToShortTitle(titleRes.val);

            const bodyRes = decrypt(rawEntry.body, auth.key);
            if (!bodyRes.ok) return bodyRes.cast();
            const bodyShortened = Entry.stringToShortTitle(bodyRes.val);

            const agentDataRes = decrypt(rawEntry.agentData, auth.key);
            if (!agentDataRes.ok) return agentDataRes.cast();

            return Result.ok({
                id: rawEntry.id,
                titleShortened,
                bodyShortened,
                created: rawEntry.created,
                createdTzOffset: rawEntry.createdTzOffset,
                pinned: rawEntry.pinned,
                latitude: rawEntry.latitude,
                longitude: rawEntry.longitude,
                agentData: agentDataRes.val,
                wordCount: rawEntry.wordCount,
                label: rawEntry.labelId ? labelsRes.val[rawEntry.labelId] : null
            });
        })
    );
}
