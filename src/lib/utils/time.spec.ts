import { Day } from '$lib/utils/time';
import { describe, expect, it } from 'vitest';

describe('Day.addDays', () => {
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
