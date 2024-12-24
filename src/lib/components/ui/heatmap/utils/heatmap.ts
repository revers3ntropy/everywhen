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
    startDate = normalizeDate(startDate);
    endDate = normalizeDate(endDate);

    return calendar
        .reduce(
            (acc, day, index) => {
                if (index % 7 === 0) {
                    acc.push([]);
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

    let max = 0;
    const startDayOfMonth = startDate.getDate();
    // 86400000 = 1000 * 60 * 60 * 24
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

    return new Array(totalDays)
        .fill(null)
        .map((_, offset) => {
            const day = getDay(data, offset, startDate, startDayOfMonth);
            if (day.value > max) {
                max = day.value;
            }

            return day;
        })
        .map(({ date, value }) => ({
            color: getColor(colors, max, value) || emptyColor,
            date,
            value
        }));
}

/**
 * Determine what color a value should be.
 */
export function getColor(colors: string[], max: number, value: number) {
    if (!colors.length || !value) return null;
    let color = colors[0];

    const intensity = value / max;

    for (let i = 1; i < colors.length; i++) {
        if (intensity < i / colors.length) {
            return color;
        }

        color = colors[i];
    }

    return colors[colors.length - 1];
}

/**
 * Aggregate the value of each day.
 */
export function getDay(
    data: { date: Date; value: number }[],
    offset: number,
    startDate: Date,
    startDayOfMonth: number
) {
    const date = new Date(startDate);
    date.setDate(startDayOfMonth + offset);

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const value = data.reduce((acc, obj) => {
        const datapoint = normalizeDate(obj.date);

        return datapoint >= date && datapoint < nextDate ? acc + obj.value : acc;
    }, 0);

    return { date, value };
}
