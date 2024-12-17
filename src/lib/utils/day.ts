import { Result } from '$lib/utils/result';
import { currentTzOffset, nowUtc } from '$lib/utils/time';
import { type DateValue, CalendarDate } from '@internationalized/date';
import type { Hours, TimestampSecs } from '../../types';

export class Day {
    public constructor(
        public readonly year: number,
        public readonly month: number,
        public readonly date: number
    ) {}

    public static fromTimestamp(timestamp: TimestampSecs, tzOffset: Hours): Day {
        const date = new Date((timestamp + tzOffset * 60 * 60) * 1000);
        return new Day(date.getFullYear(), date.getMonth() + 1, date.getDate());
    }

    public static today(tzOffset: Hours = currentTzOffset()): Day {
        return Day.fromTimestamp(nowUtc(), tzOffset);
    }

    // TODO figure out why this is ever different from today()
    public static todayUsingNativeDate(): Day {
        return new Day(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
    }

    public static fromString(str: string): Result<Day> {
        const parts = str.split('-');
        if (parts.length !== 3) {
            return Result.err(`Invalid day format: '${str}'`);
        }
        if (parts[0].length < 4 || parts[1].length !== 2 || parts[2].length !== 2) {
            return Result.err(`Invalid day format: '${str}'`);
        }
        const [year, month, date] = parts.map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(date)) {
            return Result.err(`Invalid day format: '${str}'`);
        }
        if (year < 0 || year > 99999) {
            return Result.err('Invalid year');
        }
        if (month < 1 || month > 12) {
            return Result.err('Invalid month');
        }
        if (date < 1 || date > 31) {
            return Result.err('Invalid date');
        }
        return Result.ok(new Day(year, month, date));
    }

    public static timestampsAreSameDay(
        a: TimestampSecs,
        b: TimestampSecs,
        tzOffset: Hours
    ): boolean {
        return Day.fromTimestamp(a, tzOffset).eq(Day.fromTimestamp(b, tzOffset));
    }

    public fmtIso(): string {
        const y = this.year.toString().padStart(4, '0');
        return `${y}-${this.fmtIsoNoYear()}`;
    }

    public fmtIsoNoYear(): string {
        const m = this.month.toString().padStart(2, '0');
        const d = this.date.toString().padStart(2, '0');
        return `${m}-${d}`;
    }

    public utcTimestamp(tzOffset: Hours): TimestampSecs {
        return new Date(`${this.fmtIso()}T12:00:00Z`).getTime() / 1000 - tzOffset * 60 * 60;
    }

    public dateObj(): Date {
        return new Date(`${this.fmtIso()}T12:00:00Z`);
    }

    public eq(other: Day): boolean {
        return this.year === other.year && this.month === other.month && this.date === other.date;
    }

    public set(options: { year?: number; month?: number; date?: number }): Day {
        return new Day(
            options.year ?? this.year,
            options.month ?? this.month,
            options.date ?? this.date
        );
    }

    public lt(other: Day): boolean {
        if (this.year < other.year) return true;
        if (this.year > other.year) return false;
        if (this.month < other.month) return true;
        if (this.month > other.month) return false;
        return this.date < other.date;
    }

    public lte(other: Day): boolean {
        return this.lt(other) || this.eq(other);
    }

    public gt(other: Day): boolean {
        if (this.year > other.year) return true;
        if (this.year < other.year) return false;
        if (this.month > other.month) return true;
        if (this.month < other.month) return false;
        return this.date > other.date;
    }

    public gte(other: Day): boolean {
        return this.gt(other) || this.eq(other);
    }

    public plusDays(days: number): Day {
        const date = new Date(`${this.fmtIso()}T12:00:00Z`);
        date.setDate(date.getDate() + days);
        return Day.fromTimestamp(date.getTime() / 1000, currentTzOffset());
    }

    public plusMonths(months: number): Day {
        const date = new Date(`${this.fmtIso()}T12:00:00Z`);
        date.setMonth(date.getMonth() + months);
        return Day.fromTimestamp(date.getTime() / 1000, currentTzOffset());
    }

    public startOfMonth(): Day {
        return new Day(this.year, this.month, 1);
    }

    public isInFuture(tzOffset: Hours = currentTzOffset()): boolean {
        return this.gt(Day.today(tzOffset));
    }

    public isInPast(tzOffset: Hours = currentTzOffset()): boolean {
        return this.lt(Day.today(tzOffset));
    }

    public isToday(tzOffset: Hours = currentTzOffset()): boolean {
        return this.eq(Day.today(tzOffset));
    }

    public daysUntil(day: Day, tzOffset: number = currentTzOffset()): number {
        return Math.floor((day.utcTimestamp(tzOffset) - this.utcTimestamp(tzOffset)) / 86400);
    }

    public monthsAgo(from: Day = Day.today()): number {
        let months = 0;
        let day = this.startOfMonth();
        const startOfMonthFrom = from.startOfMonth();
        while (day.lt(startOfMonthFrom)) {
            day = day.plusMonths(1);
            months++;
        }
        return months;
    }

    public toI18nDate(): DateValue {
        return new CalendarDate(this.year, this.month, this.date);
    }

    public cmp(other: Day): number {
        if (this.year !== other.year) return this.year - other.year;
        if (this.month !== other.month) return this.month - other.month;
        return this.date - other.date;
    }

    public static fromI18nDate(d: DateValue) {
        return new Day(d.year, d.month, d.day);
    }
}
