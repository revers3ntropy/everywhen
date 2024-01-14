import { Day } from '$lib/utils/day';
import { describe, expect, it } from 'vitest';

describe('Day', () => {
    it('creates and formats dates correctly', () => {
        expect(new Day(2022, 1, 1).fmtIso()).toBe('2022-01-01');
        expect(new Day(2022, 1, 2).fmtIso()).toBe('2022-01-02');
        expect(new Day(2022, 2, 1).fmtIso()).toBe('2022-02-01');
        expect(new Day(2023, 1, 1).fmtIso()).toBe('2023-01-01');
        expect(new Day(2022, 11, 1).fmtIso()).toBe('2022-11-01');
        expect(new Day(2022, 1, 11).fmtIso()).toBe('2022-01-11');
        expect(new Day(0, 0, 0).fmtIso()).toBe('0000-00-00');
        expect(new Day(9999, 12, 31).fmtIso()).toBe('9999-12-31');
        expect(new Day(12345, 12, 31).fmtIso()).toBe('12345-12-31');
        expect(Day.fromString('2022-01-01').unwrap().fmtIso()).toBe('2022-01-01');
        expect(Day.fromString('2022-01-02').unwrap().fmtIso()).toBe('2022-01-02');
        expect(Day.fromString('2022-11-01').unwrap().fmtIso()).toBe('2022-11-01');
        expect(Day.fromString('12345-01-01').unwrap().fmtIso()).toBe('12345-01-01');
        expect(Day.fromString('0000-01-01').unwrap().fmtIso()).toBe('0000-01-01');
        expect(Day.fromString('0001-01-01').unwrap().fmtIso()).toBe('0001-01-01');
        expect(Day.fromString('1234-12-31').ok).toBe(true);
        expect(Day.fromString('123-12-31').ok).toBe(false);
        expect(Day.fromString('2023-1-01').ok).toBe(false);
        expect(Day.fromString('2023-01-3').ok).toBe(false);
        expect(Day.fromString('2023-01-33').ok).toBe(false);
        expect(Day.fromString('0-0-0').ok).toBe(false);
        expect(Day.fromString('0-00-00').ok).toBe(false);
        expect(Day.fromString('0000-00-00').ok).toBe(false);
        expect(Day.fromString('0001-01-00').ok).toBe(false);
        expect(Day.fromString('0001-00-01').ok).toBe(false);
    });

    it('Adds one day correctly, accounting for month and year changes', () => {
        expect(new Day(2022, 1, 1).fmtIso()).toBe('2022-01-01');
        expect(new Day(2022, 1, 1).plusDays(0)?.fmtIso()).toBe('2022-01-01');
        expect(new Day(2022, 1, 1).plusDays(1)?.fmtIso()).toBe('2022-01-02');
        expect(new Day(2022, 1, 1).plusDays(10)?.fmtIso()).toBe('2022-01-11');
        expect(new Day(2022, 12, 31).plusDays(1)?.fmtIso()).toBe('2023-01-01');
        expect(new Day(2022, 12, 31).plusDays(365)?.fmtIso()).toBe('2023-12-31');
        expect(new Day(2022, 12, 31).plusDays(366)?.fmtIso()).toBe('2024-01-01');
        expect(new Day(2023, 11, 30).plusDays(1)?.fmtIso()).toBe('2023-12-01');
        expect(new Day(2023, 11, 30).plusDays(3)?.fmtIso()).toBe('2023-12-03');
        expect(new Day(2022, 1, 1).plusDays(-1)?.fmtIso()).toBe('2021-12-31');
        expect(new Day(2022, 1, 1).plusDays(-10)?.fmtIso()).toBe('2021-12-22');
        expect(new Day(2022, 1, 1).plusDays(-365)?.fmtIso()).toBe('2021-01-01');
        expect(new Day(2022, 1, 1).plusDays(-366)?.fmtIso()).toBe('2020-12-31');
        expect(new Day(2022, 1, 4).plusDays(-2)?.fmtIso()).toBe('2022-01-02');
    });

    it('Compares with lt correctly', () => {
        expect(new Day(2022, 1, 1).lt(new Day(2022, 1, 1))).toBe(false);
        expect(new Day(2022, 1, 1).lt(new Day(2022, 1, 2))).toBe(true);
        expect(new Day(2022, 1, 1).lt(new Day(2022, 2, 1))).toBe(true);
        expect(new Day(2022, 1, 1).lt(new Day(2023, 1, 1))).toBe(true);
        expect(new Day(2022, 1, 1).lt(new Day(2021, 1, 1))).toBe(false);
        expect(new Day(2022, 1, 2).lt(new Day(2022, 1, 1))).toBe(false);
        expect(new Day(2022, 2, 1).lt(new Day(2022, 1, 1))).toBe(false);
        expect(new Day(2023, 1, 1).lt(new Day(2022, 1, 1))).toBe(false);
        expect(new Day(2022, 2, 1).lt(new Day(2022, 1, 1))).toBe(false);
    });

    it('adds months correctly', () => {
        expect(new Day(2022, 1, 1).plusMonths(0)?.fmtIso()).toBe('2022-01-01');
        expect(new Day(2022, 1, 1).plusMonths(1)?.fmtIso()).toBe('2022-02-01');
        expect(new Day(2022, 1, 1).plusMonths(2)?.fmtIso()).toBe('2022-03-01');
        expect(new Day(2022, 1, 1).plusMonths(12)?.fmtIso()).toBe('2023-01-01');
        expect(new Day(2022, 1, 1).plusMonths(13)?.fmtIso()).toBe('2023-02-01');
        expect(new Day(2022, 1, 1).plusMonths(24)?.fmtIso()).toBe('2024-01-01');
        expect(new Day(2022, 1, 1).plusMonths(-1)?.fmtIso()).toBe('2021-12-01');
        expect(new Day(2022, 1, 1).plusMonths(-2)?.fmtIso()).toBe('2021-11-01');
        expect(new Day(2022, 1, 1).plusMonths(-12)?.fmtIso()).toBe('2021-01-01');
    });

    it('calculates months ago correctly', () => {
        expect(Day.today().monthsAgo()).toBe(0);
        expect(Day.today().plusMonths(-1).monthsAgo()).toBe(1);
        expect(Day.today().plusMonths(-2).monthsAgo()).toBe(2);
        expect(Day.today().plusMonths(-12).monthsAgo()).toBe(12);
        expect(Day.today().plusMonths(-13).monthsAgo()).toBe(13);
        expect(Day.today().plusMonths(-24).monthsAgo()).toBe(24);
        expect(new Day(2023, 1, 1).monthsAgo(new Day(2023, 1, 1))).toBe(0);
        expect(new Day(2023, 1, 2).monthsAgo(new Day(2023, 1, 1))).toBe(0);
        expect(new Day(2023, 1, 1).monthsAgo(new Day(2023, 1, 2))).toBe(0);
        expect(new Day(2023, 1, 1).monthsAgo(new Day(2023, 2, 1))).toBe(1);
        expect(new Day(2023, 1, 1).monthsAgo(new Day(2023, 2, 2))).toBe(1);
        expect(new Day(2023, 1, 2).monthsAgo(new Day(2023, 2, 1))).toBe(1);
    });
});
