import type { Auth } from '$lib/controllers/auth/auth';
import { query } from '$lib/db/mysql.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import { Day } from '$lib/utils/day';
import type { PageServerLoad } from './$types';
import { Entry } from '$lib/controllers/entry/entry.server';
import { By } from './helpers';

export const load = cachedPageRoute(async auth => {
    const start = performance.now();
    const earliestCreated = await Entry.earliestEntryCreation(auth);
    // if no earliest entry then no entries at all, so return empty stats
    if (earliestCreated === null) {
        return {
            timeOfDayData: { [By.Entries]: [], [By.Words]: [] },
            entriesByYear: { [By.Entries]: [], [By.Words]: [] },
            entriesByMonth: { [By.Entries]: [], [By.Words]: [] },
            heatmapData: { [By.Entries]: [], [By.Words]: [] },
            entryCount: 0,
            wordCount: 0,
            dayOfFirstEntry: Day.today().fmtIso(),
            loadTime: performance.now() - start
        };
    }
    const dayOfFirstEntry = Day.fromTimestamp(
        earliestCreated.created,
        earliestCreated.createdTzOffset
    );

    const [{ wordCount, entryCount }, heatmapData, timeOfDayData, entriesByYear, entriesByMonth] =
        await Promise.all([
            Entry.counts(auth),
            getHeatMapData(auth),
            query<{ count: number; wordCount: number; timeOfDay: number }[]>`
                SELECT
                    COUNT(*) as count,
                    SUM(entries.wordCount) as wordCount,
                    DATE_FORMAT(FROM_UNIXTIME(entries.created + (createdTzOffset - TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW())) * 60 * 60), '%H') + 0 as timeOfDay
                FROM entries
                WHERE userId = ${auth.id}
                  AND entries.deleted IS NULL
                GROUP BY timeOfDay
                ORDER BY timeOfDay
            `.then(entryDetailsByTimeOfDay => {
                const timeOfDayData = {
                    [By.Entries]: [] as { timeOfDay: number; value: number }[],
                    [By.Words]: [] as { timeOfDay: number; value: number }[]
                };
                for (let i = 0; i < 24; i++) {
                    const entry = entryDetailsByTimeOfDay.find(e => e.timeOfDay === i);
                    timeOfDayData[By.Entries].push({
                        timeOfDay: i,
                        value: entry ? entry.count : 0
                    });
                    timeOfDayData[By.Words].push({
                        timeOfDay: i,
                        value: entry ? entry.wordCount : 0
                    });
                }
                return timeOfDayData;
            }),
            query<{ count: number; wordCount: number; year: number }[]>`
                SELECT
                    COUNT(*) as count,
                    SUM(entries.wordCount) as wordCount,
                    SUBSTRING(day, 1, 4) + 0 as year
                FROM entries
                WHERE userId = ${auth.id}
                  AND entries.deleted IS NULL
                GROUP BY year
                ORDER BY year
            `.then(entryDetailsByYear => {
                const entriesByYear = {
                    [By.Entries]: [] as number[],
                    [By.Words]: [] as number[]
                };
                for (
                    let year = dayOfFirstEntry.year;
                    year <= Day.todayUsingNativeDate().year;
                    year++
                ) {
                    const entry = entryDetailsByYear.find(e => e.year === year);
                    entriesByYear[By.Entries].push(entry ? entry.count : 0);
                    entriesByYear[By.Words].push(entry ? entry.wordCount : 0);
                }
                return entriesByYear;
            }),
            await query<{ count: number; wordCount: number; month: string }[]>`
                SELECT
                    COUNT(*) as count,
                    SUM(entries.wordCount) as wordCount,
                    -- gets the year and month, YYYY-MM
                    SUBSTRING(day, 1, 7) as month
                FROM entries
                WHERE userId = ${auth.id}
                    AND entries.deleted IS NULL
                GROUP BY month
                ORDER BY month
            `.then(entryDetailsByMonth => {
                const entriesByMonth = {
                    [By.Entries]: [] as number[],
                    [By.Words]: [] as number[]
                };
                for (
                    let year = dayOfFirstEntry.year;
                    year <= Day.todayUsingNativeDate().year;
                    year++
                ) {
                    for (let month = 1; month <= 12; month++) {
                        const yearAndMonth = `${year.toString().padStart(4, '0')}-${month
                            .toString()
                            .padStart(2, '0')}`;
                        const entry = entryDetailsByMonth.find(e => e.month === yearAndMonth);
                        entriesByMonth[By.Entries].push(entry ? entry.count : 0);
                        entriesByMonth[By.Words].push(entry ? entry.wordCount : 0);
                    }
                }
                // TODO maybe filter off the months at the beginning and end that have no entries?
                return entriesByMonth;
            })
        ]);

    return {
        timeOfDayData,
        entriesByYear,
        entriesByMonth,
        heatmapData,
        entryCount,
        wordCount,
        dayOfFirstEntry: dayOfFirstEntry.fmtIso(),
        loadTime: performance.now() - start
    };
}) satisfies PageServerLoad;

async function getHeatMapData(auth: Auth) {
    const entryDetailsByDay = await query<{ count: number; wordCount: number; day: string }[]>`
        SELECT 
            COUNT(*) as count,
            SUM(entries.wordCount) as wordCount,
            day
        FROM entries
        WHERE userId = ${auth.id}
          AND entries.deleted IS NULL
        GROUP BY day
    `;
    return {
        [By.Words]: entryDetailsByDay.map(entry => ({
            date: entry.day,
            value: entry.wordCount
        })),
        [By.Entries]: entryDetailsByDay.map(entry => ({
            date: entry.day,
            value: entry.count
        }))
    };
}
