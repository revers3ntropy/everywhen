import type { Auth } from '$lib/controllers/auth/auth.server';
import type { EntrySummary, RawEntrySummary } from '$lib/controllers/entry/entry';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Label } from '$lib/controllers/label/label.server';
import { query } from '$lib/db/mysql.server';
import { decrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { currentTzOffset, Day, fmtUtc } from '$lib/utils/time';

export async function getSummariesNYearsAgo(
    auth: Auth
): Promise<Result<Record<string, EntrySummary[]>>> {
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
            AND DATE_FORMAT(FROM_UNIXTIME(created + createdTzOffset * 60 * 60), '%m-%d') = DATE_FORMAT(NOW(), '%m-%d')
        ORDER BY created DESC, id
    `;

    return (await summariesFromRaw(auth, rawEntries)).map(summaries => {
        const today = Day.today(currentTzOffset()).fmtIso();
        const byDay: Record<string, EntrySummary[]> = {};
        for (const entry of summaries) {
            const date = fmtUtc(entry.created, entry.createdTzOffset, 'YYYY-MM-DD');
            if (date === today) continue;
            byDay[date] ??= [];
            byDay[date].push(entry);
        }
        return byDay;
    });
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
