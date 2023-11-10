import { query } from '$lib/db/mysql.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import { daysSince } from '$lib/utils/time';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async auth => {
    const earliestCreatedQuery = await query<{ created: number }[]>`
        SELECT created
        FROM entries
        WHERE userId = ${auth.id}
        AND deleted IS NULL
        ORDER BY created ASC
        LIMIT 1
    `;

    if (!earliestCreatedQuery.length) {
        return {
            summaries: [],
            entryCount: 0,
            commonWords: [],
            days: 0,
            wordCount: 0
        };
    }

    const earliestEntryTimeStamp = earliestCreatedQuery[0].created;

    const wordCountQuery = query<{ wordCount: number; entryCount: number }[]>`
        SELECT SUM(wordCount) as wordCount, COUNT(*) as entryCount
        FROM entries
        WHERE userId = ${auth.id}
        AND deleted IS NULL
    `.then(([res]) => res);

    const wordFrequenciesQuery = query<{ word: string; count: number }[]>`
        SELECT word, count
        FROM wordsInEntries
        WHERE userId = ${auth.id}
        AND count > 0
        AND entryIsDeleted = 0
    `
        .then(words =>
            words.reduce(
                (map, { word, count }) => {
                    map[word] ??= 0;
                    map[word] += count;
                    return map;
                },
                {} as Record<string, number>
            )
        )
        .then(wordsMap =>
            Object.entries(wordsMap)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 100)
        );

    const summariesQuery = query<
        {
            created: number;
            createdTzOffset: number;
            wordCount: number;
            agentData: string;
        }[]
    >`
        SELECT
            created,
            createdTzOffset,
            wordCount,
            agentData
        FROM entries
        WHERE userId = ${auth.id}
          AND deleted IS NULL
        ORDER BY created DESC, id
    `;

    const [{ wordCount, entryCount }, commonWordsArray, summaries] = await Promise.all([
        wordCountQuery,
        wordFrequenciesQuery,
        summariesQuery
    ]);

    // should be time zone agnostic?
    const days = daysSince(earliestEntryTimeStamp, 0);

    return {
        summaries,
        entryCount,
        commonWords: commonWordsArray,
        days,
        wordCount
    };
}) satisfies PageServerLoad;
