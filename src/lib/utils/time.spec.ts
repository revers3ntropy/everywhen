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
});
