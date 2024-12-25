import { Day } from '$lib/utils/day';
import { getMonthEnd, getMonthStart, getWeekEnd, getWeekStart, normalizeDate } from './date';

/**
 * Divide a calendar into months.
 */
export function chunkMonths(
    allowOverflow: boolean,
    calendar: { date: Date; value: number; color: string }[],
    endDate: Date,
    startDate: Date
): { date: Date; value: number; color: string }[][] {
    let prevMonth = -1;

    startDate = normalizeDate(startDate);
    endDate = normalizeDate(endDate);

    return calendar
        .reduce(
            (acc, day) => {
                const currentMonth = day.date.getMonth();

                if (prevMonth !== currentMonth) {
                    acc.push([]);
                    prevMonth = currentMonth;
                }

                if (
                    allowOverflow ||
                    ((!startDate || day.date >= startDate) && (!endDate || day.date <= endDate))
                ) {
                    acc[acc.length - 1].push(day);
                }

                return acc;
            },
            [] as { date: Date; value: number; color: string }[][]
        )
        .filter(month => month.length);
}

/**
 * Divide a calendar into weeks.
 */
export function chunkWeeks(
    allowOverflow: boolean,
    calendar: { date: Date; value: number; color: string }[],
    endDate: Date,
    startDate: Date
): { date: Date; value: number; color: string }[][] {
    return calendar
        .reduce(
            (acc, day, index) => {
                if (index % 7 === 0) {
                    acc.push([]);
                }

                if (allowOverflow || (day.date >= startDate && day.date <= endDate)) {
                    acc[acc.length - 1].push(day);
                }

                return acc;
            },
            [] as { date: Date; value: number; color: string }[][]
        )
        .filter(week => week.length);
}

/**
 * Determine the first day rendered on the heatmap.
 */
export function getCalendar(
    colors: string[],
    data: { date: Date; value: number }[],
    emptyColor: string,
    endDate: Date,
    startDate: Date,
    view: string
): { date: Date; value: number; color: string }[] {
    if (view === 'monthly') {
        startDate = getMonthStart(startDate);
        endDate = getMonthEnd(endDate);
    } else {
        startDate = getWeekStart(startDate);
        endDate = getWeekEnd(endDate);
    }
    const startDay = Day.fromDate(startDate);

    let max = 0;
    // 86400000 = 1000 * 60 * 60 * 24
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
    const dataMappedByDay = data.reduce(
        (acc, { date, value }) => {
            const day = Day.fromDate(date).fmtIso();
            if (!(day in acc)) {
                acc[day] = value;
            } else {
                acc[day] += value;
            }
            if (acc[day] > max) {
                max = acc[day];
            }
            return acc;
        },
        {} as Record<string, number>
    );
    return new Array(totalDays)
        .fill(null)
        .map((_, index) => {
            const day = startDay.plusDays(index);
            return {
                date: day.dateObj(),
                value: dataMappedByDay[day.fmtIso()] || 0
            };
        })
        .map(({ date, value }) => {
            return {
                // max must be its final value here
                color: getColor(colors, max, value) ?? emptyColor,
                date,
                value
            };
        });
}

/**
 * Determine what color a value should be.
 */
export function getColor(colors: string[], max: number, value: number) {
    if (!colors.length || !value) return null;
    const index = Math.floor((value / max) * colors.length);
    return colors[index] ?? colors[colors.length - 1];
}
