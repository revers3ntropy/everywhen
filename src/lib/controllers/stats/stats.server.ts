import { DAYS_OF_WEEK } from '$lib/constants';
import { query } from '$lib/db/mysql.server';
import { Day } from '$lib/utils/day';
import { Result } from '$lib/utils/result';
import { fmtUtc } from '$lib/utils/time';
import type { TimestampSecs } from '../../../types';
import type { Auth } from '../auth/auth.server';
import { By, Grouping, Stats as _Stats, type StatsData } from './stats';

namespace StatsServer {
    export async function getEntryStats(
        auth: Auth,
        grouping: Grouping,
        from: TimestampSecs,
        to: TimestampSecs
    ): Promise<Result<StatsData>> {
        switch (grouping) {
            case Grouping.Hour:
                return Result.ok({
                    labels: Array.from({ length: 24 }, (_, i) => i.toString()),
                    values: await getTimeOfDayData(auth, from, to)
                });
            case Grouping.Day:
                return Result.ok(await getEntriesByDay(auth, from, to));
            case Grouping.DayOfWeek:
                return Result.ok({
                    labels: DAYS_OF_WEEK.map(d => d as string),
                    values: await getEntriesByDayOfWeek(auth, from, to)
                });
            case Grouping.Month:
                return Result.ok(await getEntriesByMonth(auth, from, to));
            case Grouping.Year:
                return Result.ok(await getEntriesByYear(auth, from, to));

            default:
                return Result.err('Not implemented');
        }
    }

    async function getTimeOfDayData(auth: Auth, from: TimestampSecs, to: TimestampSecs) {
        const entriesByTime = await query<
            { count: number; wordCount: number; timeOfDay: number }[]
        >`
            SELECT
                COUNT(*) as count,
                SUM(entries.wordCount) as wordCount,
                DATE_FORMAT(FROM_UNIXTIME(entries.created + (createdTzOffset - TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW())) * 60 * 60), '%H') + 0 as timeOfDay
            FROM entries
            WHERE userId = ${auth.id}
              AND entries.deleted IS NULL
                AND entries.created >= ${from}
                AND entries.created <= ${to}
            GROUP BY timeOfDay
            ORDER BY timeOfDay
        `;
        const timeOfDayData = {
            [By.Entries]: [] as number[],
            [By.Words]: [] as number[]
        };
        for (let i = 0; i < 24; i++) {
            const entry = entriesByTime.find(e => e.timeOfDay === i);
            timeOfDayData[By.Entries].push(entry ? entry.count : 0);
            timeOfDayData[By.Words].push(entry ? entry.wordCount : 0);
        }
        return timeOfDayData;
    }

    async function getEntriesByDayOfWeek(auth: Auth, from: TimestampSecs, to: TimestampSecs) {
        const entryDetailsByDayOfWeek = await query<
            { count: number; wordCount: number; dayOfWeek: number }[]
        >`
            SELECT
                COUNT(*) as count,
                SUM(entries.wordCount) as wordCount,
                DATE_FORMAT(FROM_UNIXTIME(entries.created + (createdTzOffset - TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW())) * 60 * 60), '%w') + 0 as dayOfWeek
            FROM entries
            WHERE userId = ${auth.id}
                AND entries.deleted IS NULL
                AND entries.created >= ${from}
                AND entries.created <= ${to}
            GROUP BY dayOfWeek
            ORDER BY dayOfWeek
        `;
        const timeOfDayData = {
            [By.Entries]: [] as number[],
            [By.Words]: [] as number[]
        };
        for (let i = 0; i < 7; i++) {
            const entry = entryDetailsByDayOfWeek.find(e => e.dayOfWeek === i);
            timeOfDayData[By.Entries].push(entry ? entry.count : 0);
            timeOfDayData[By.Words].push(entry ? entry.wordCount : 0);
        }
        return timeOfDayData;
    }

    async function getEntriesByMonth(auth: Auth, from: TimestampSecs, to: TimestampSecs) {
        const entryDetailsByMonth = await query<
            { count: number; wordCount: number; month: string }[]
        >`
            SELECT
                COUNT(*) as count,
                SUM(entries.wordCount) as wordCount,
                -- gets the year and month 'YYYY-MM'
                SUBSTRING(day, 1, 7) as month
            FROM entries
            WHERE userId = ${auth.id}
                AND entries.deleted IS NULL
                AND entries.created >= ${from}
                AND entries.created <= ${to}
            GROUP BY month
            ORDER BY STR_TO_DATE(CONCAT(month, '-01'), '%Y-%m-%d')
        `;
        const firstMonthDay = Day.fromString(`${entryDetailsByMonth[0].month}-01`).unwrap();
        const labels = [];
        const entriesByMonth = {
            [By.Entries]: [] as number[],
            [By.Words]: [] as number[]
        };
        for (let year = firstMonthDay.year; year <= Day.todayUsingNativeDate().year; year++) {
            for (let month = 1; month <= 12; month++) {
                const startOfMonthDay = new Day(year, month, 1);
                const yearAndMonth = startOfMonthDay.fmtIso().substring(0, 7);
                labels.push(
                    fmtUtc(
                        startOfMonthDay.utcTimestampMiddleOfDay(0),
                        0,
                        // show year for January and December
                        [1, 12].includes(month) ? 'YYYY MMM' : 'MMM'
                    )
                );
                const entry = entryDetailsByMonth.find(e => e.month === yearAndMonth);
                entriesByMonth[By.Entries].push(entry ? entry.count : 0);
                entriesByMonth[By.Words].push(entry ? entry.wordCount : 0);
            }
        }
        // TODO maybe filter off the months at the beginning and end that have no entries?
        return { labels, values: entriesByMonth };
    }

    async function getEntriesByYear(auth: Auth, from: TimestampSecs, to: TimestampSecs) {
        const entryDetailsByYear = await query<
            { count: number; wordCount: number; year: number }[]
        >`
            SELECT
                COUNT(*) as count,
                SUM(entries.wordCount) as wordCount,
                SUBSTRING(day, 1, 4) + 0 as year
            FROM entries
            WHERE userId = ${auth.id}
                AND entries.deleted IS NULL
                AND entries.created >= ${from}
                AND entries.created <= ${to}
            GROUP BY year
            ORDER BY year
        `;
        const labels: string[] = [];
        const entriesByYear = {
            [By.Entries]: [] as number[],
            [By.Words]: [] as number[]
        };
        if (entryDetailsByYear.length < 1) {
            return { labels, values: entriesByYear };
        }
        const firstYear = entryDetailsByYear[0].year;
        for (let year = firstYear; year <= Day.today().year; year++) {
            labels.push(year.toString());
            const entry = entryDetailsByYear.find(e => e.year === year);
            entriesByYear[By.Entries].push(entry ? entry.count : 0);
            entriesByYear[By.Words].push(entry ? entry.wordCount : 0);
        }
        return { labels, values: entriesByYear };
    }

    async function getEntriesByDay(auth: Auth, from: TimestampSecs, to: TimestampSecs) {
        const entryDetailsByDay = await query<{ count: number; wordCount: number; day: string }[]>`
            SELECT
                COUNT(*) as count,
                SUM(entries.wordCount) as wordCount,
                day
            FROM entries
            WHERE userId = ${auth.id}
                AND entries.deleted IS NULL
                AND entries.created >= ${from}
                AND entries.created <= ${to}
            GROUP BY day
            ORDER BY STR_TO_DATE(day, '%Y-%m-%d')
        `;
        const indexedByDay = entryDetailsByDay.reduce(
            (acc, entry) => {
                acc[entry.day] = entry;
                return acc;
            },
            {} as Record<string, { count: number; wordCount: number }>
        );
        const labels: string[] = [];
        const timeOfDayData = {
            [By.Entries]: [] as number[],
            [By.Words]: [] as number[]
        };
        if (entryDetailsByDay.length < 1) {
            return { labels, values: timeOfDayData };
        }
        const firstDay = Day.fromString(entryDetailsByDay[0].day).unwrap();
        for (let d = firstDay; d.lte(Day.today()); d = d.plusDays(1)) {
            const dFmtIso = d.fmtIso();
            const entry = indexedByDay[dFmtIso];
            labels.push(dFmtIso);
            timeOfDayData[By.Entries].push(entry ? entry.count : 0);
            timeOfDayData[By.Words].push(entry ? entry.wordCount : 0);
        }
        return { labels, values: timeOfDayData };
    }

    export async function wordCounts(auth: Auth, offset: number, pageSize: number) {
        return await query<{ word: string; count: number }[]>`
            SELECT word, SUM(count) as count
            FROM wordsInEntries
            WHERE userId = ${auth.id}
                AND count > 0
                AND entryIsDeleted = 0
            GROUP BY word
            ORDER BY count DESC
            LIMIT ${offset}, ${pageSize}
        `;
    }

    export async function uniqueWordCount(auth: Auth): Promise<number> {
        const res = await query<{ count: number }[]>`
            SELECT COUNT(DISTINCT word) as count
            FROM wordsInEntries
            WHERE userId = ${auth.id}
                AND count > 0
                AND entryIsDeleted = 0
        `;
        return res[0].count;
    }
}

export const Stats = {
    ...StatsServer,
    ..._Stats
};
