import type { Auth } from '$lib/controllers/auth/auth';
import { Entry } from '$lib/controllers/entry/entry.server';
import type { FeedItem } from '$lib/controllers/feed/feed';
import type { FeedProvider } from '$lib/controllers/feed/feed.server';
import { query } from '$lib/db/mysql.server';
import { decrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { Day } from '$lib/utils/time';

export const entryEditsProvider = {
    async feedItemsOnDay(auth: Auth, day: Day): Promise<Result<FeedItem[]>> {
        const minTimestamp = day.utcTimestamp(24);
        const maxTimestamp = day.utcTimestamp(-24);
        const rawEdits = await query<
            {
                id: string;
                entryId: string;
                created: number;
                createdTzOffset: number;
                latitude: number | null;
                longitude: number | null;
                agentData: string;
                body: string;
                title: string;
            }[]
        >`
            SELECT entryEdits.id,
                   entryEdits.entryId,
                   entryEdits.created,
                   entryEdits.createdTzOffset,
                   entryEdits.latitude,
                   entryEdits.longitude,
                   entryEdits.agentData,
                   entries.body,
                   entries.title
            FROM entryEdits, entries
            WHERE entryEdits.userId = ${auth.id}
                AND entryEdits.entryId = entries.id
                AND entries.deleted IS NULL
                AND entryEdits.created > ${minTimestamp}
                AND entryEdits.created < ${maxTimestamp}
                AND DATE_FORMAT(FROM_UNIXTIME(entryEdits.created + entryEdits.createdTzOffset * 60 * 60), '%Y-%m-%d') = ${day.fmtIso()}
            ORDER BY entryEdits.created DESC, entries.id
        `;
        return Result.collect(
            rawEdits.map((rawEdit): Result<FeedItem> => {
                const agentData = decrypt(rawEdit.agentData, auth.key);
                if (!agentData.ok) return agentData.cast();
                const body = decrypt(rawEdit.body, auth.key);
                if (!body.ok) return body.cast();
                const title = decrypt(rawEdit.title, auth.key);
                if (!title.ok) return title.cast();
                return Result.ok({
                    type: 'entry-edit',
                    id: rawEdit.id,
                    entryId: rawEdit.entryId,
                    created: rawEdit.created,
                    createdTzOffset: rawEdit.createdTzOffset,
                    latitude: rawEdit.latitude,
                    longitude: rawEdit.longitude,
                    agentData: agentData.unwrap(),
                    bodyShortened: Entry.stringToShortTitle(body.val),
                    titleShortened: Entry.stringToShortTitle(title.val)
                });
            })
        );
    },

    async nextDayWithFeedItems(
        auth: Auth,
        day: Day,
        inFuture: boolean
    ): Promise<Result<Day | null>> {
        const minTimestamp = day.utcTimestamp(24);
        const maxTimestamp = day.utcTimestamp(-24);
        const entries = inFuture
            ? await query<{ day: string }[]>`
                SELECT DATE_FORMAT(FROM_UNIXTIME(entryEdits.created + entryEdits.createdTzOffset * 60 * 60), '%Y-%m-%d') as day
                FROM entryEdits, entries
                WHERE deleted IS NULL
                    AND entryEdits.entryId = entries.id
                    AND entryEdits.userId = ${auth.id}
                    AND entryEdits.created > ${minTimestamp}
                    AND CONVERT(DATE_FORMAT(FROM_UNIXTIME(entryEdits.created + entryEdits.createdTzOffset * 60 * 60), '%Y-%m-%d'), DATE)
                        > CONVERT(${day.fmtIso()}, DATE)
                ORDER BY entryEdits.created + entryEdits.createdTzOffset * 60 * 60 ASC
                LIMIT 1
            `
            : await query<{ day: string }[]>`
                SELECT DATE_FORMAT(FROM_UNIXTIME(entryEdits.created + entryEdits.createdTzOffset * 60 * 60), '%Y-%m-%d') as day
                FROM entryEdits, entries
                WHERE deleted IS NULL
                    AND entryEdits.entryId = entries.id
                    AND entryEdits.userId = ${auth.id}
                    AND entryEdits.created < ${maxTimestamp}
                    AND CONVERT(DATE_FORMAT(FROM_UNIXTIME(entryEdits.created + entryEdits.createdTzOffset * 60 * 60), '%Y-%m-%d'), DATE)
                        < CONVERT(${day.fmtIso()}, DATE)
                ORDER BY entryEdits.created + entryEdits.createdTzOffset * 60 * 60 DESC
                LIMIT 1
            `;
        if (entries.length !== 1) return Result.ok(null);
        return Result.ok(Day.fromString(entries[0].day).unwrap());
    }
} satisfies FeedProvider;
