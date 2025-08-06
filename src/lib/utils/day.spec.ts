import { describe, it, expect } from 'vitest';
import { Day } from './day';

describe('Day', () => {
    it('should create a Day instance from a string', () => {
        const dayResult = Day.fromString('2024-01-29');
        expect(dayResult.ok).toBe(true);
        const day = dayResult.unwrap();
        expect(day.year).toBe(2024);
        expect(day.month).toBe(1);
        expect(day.date).toBe(29);
    });

    it('should return an error for an invalid string format', () => {
        const dayResult = Day.fromString('2024-01-29T12:00:00');
        expect(dayResult.ok).toBe(false);
    });

    it('should format the date to an ISO string', () => {
        const day = new Day(2024, 1, 29);
        expect(day.fmtIso()).toBe('2024-01-29');
    });

    it('should get the UTC timestamp for the middle of the day', () => {
        const day = new Day(2024, 1, 29);
        const tzOffset = 0;
        const expectedTimestamp = new Date('2024-01-29T12:00:00Z').getTime() / 1000;
        expect(day.utcTimestampMiddleOfDay(tzOffset)).toBe(expectedTimestamp);
    });

    it('should get the UTC timestamp for the start of the day', () => {
        const day = new Day(2024, 1, 29);
        const tzOffset = 0;
        const expectedTimestamp = new Date('2024-01-29T00:00:00Z').getTime() / 1000;
        expect(day.utcTimestampStartOfDay(tzOffset)).toBe(expectedTimestamp);
    });

    it('should get the UTC timestamp for the end of the day', () => {
        const day = new Day(2024, 1, 29);
        const tzOffset = 0;
        const expectedTimestamp = new Date('2024-01-29T23:59:59Z').getTime() / 1000;
        expect(day.utcTimestampEndOfDay(tzOffset)).toBe(expectedTimestamp);
    });

    it('should add days to the current date', () => {
        const day = new Day(2024, 1, 29);
        const newDay = day.plusDays(3);
        expect(newDay.fmtIso()).toBe('2024-02-01');
    });

    it('should subtract days from the current date', () => {
        const day = new Day(2024, 2, 1);
        const newDay = day.plusDays(-3);
        expect(newDay.fmtIso()).toBe('2024-01-29');
    });

    it('should check for equality between two Day instances', () => {
        const day1 = new Day(2024, 1, 29);
        const day2 = new Day(2024, 1, 29);
        const day3 = new Day(2024, 1, 30);
        expect(day1.eq(day2)).toBe(true);
        expect(day1.eq(day3)).toBe(false);
    });

    it('should create a Day instance from a timestamp', () => {
        const timestamp = 1706539200; // 2024-01-29 12:00:00 UTC
        const tzOffset = 0;
        const day = Day.fromTimestamp(timestamp, tzOffset);
        expect(day.year).toBe(2024);
        expect(day.month).toBe(1);
        expect(day.date).toBe(29);
    });

    it('should create a Day instance from a timestamp with a non-zero timezone offset', () => {
        const timestamp = 1706569200; // 2024-01-29 23:00:00 UTC
        const tzOffset = -5; // EST
        const day = Day.fromTimestamp(timestamp, tzOffset);
        expect(day.year).toBe(2024);
        expect(day.month).toBe(1);
        expect(day.date).toBe(29);
    });

    it('should determine if two timestamps are on the same day with a non-zero timezone offset', () => {
        const timestamp1 = 1706569200; // 2024-01-29 23:00:00 UTC
        const timestamp2 = 1706590740; // 2024-01-30 04:59:00 UTC
        const tzOffset = -5; // EST
        expect(Day.timestampsAreSameDay(timestamp1, timestamp2, tzOffset)).toBe(true);
    });

    it('should create a Day instance from a timestamp with a positive timezone offset', () => {
        const timestamp = 1706580000; // 2024-01-30 02:00:00 UTC
        const tzOffset = 8; // GMT+8
        const day = Day.fromTimestamp(timestamp, tzOffset);
        expect(day.fmtIso()).toBe('2024-01-30');
    });

    it('should get the UTC timestamp for the start of the day with a negative timezone offset', () => {
        const day = new Day(2024, 1, 29);
        const tzOffset = -5; // EST
        const expectedTimestamp = new Date('2024-01-29T05:00:00Z').getTime() / 1000;
        expect(day.utcTimestampStartOfDay(tzOffset)).toBe(expectedTimestamp);
    });

    it('should get the UTC timestamp for the end of the day with a negative timezone offset', () => {
        const day = new Day(2024, 1, 29);
        const tzOffset = -5; // EST
        const expectedTimestamp = new Date('2024-01-30T04:59:59Z').getTime() / 1000;
        expect(day.utcTimestampEndOfDay(tzOffset)).toBe(expectedTimestamp);
    });

    it('should get the UTC timestamp for the start of the day with a positive timezone offset', () => {
        const day = new Day(2024, 1, 30);
        const tzOffset = 8; // GMT+8
        const expectedTimestamp = new Date('2024-01-29T16:00:00Z').getTime() / 1000;
        expect(day.utcTimestampStartOfDay(tzOffset)).toBe(expectedTimestamp);
    });

    it('should get the UTC timestamp for the end of the day with a positive timezone offset', () => {
        const day = new Day(2024, 1, 30);
        const tzOffset = 8; // GMT+8
        const expectedTimestamp = new Date('2024-01-30T15:59:59Z').getTime() / 1000;
        expect(day.utcTimestampEndOfDay(tzOffset)).toBe(expectedTimestamp);
    });

    it('should determine if two timestamps are on different days with a positive timezone offset', () => {
        const timestamp1 = 1706540400; // 2024-01-29 15:00:00 UTC
        const timestamp2 = 1706547600; // 2024-01-29 17:00:00 UTC
        const tzOffset = 8; // GMT+8
        expect(Day.timestampsAreSameDay(timestamp1, timestamp2, tzOffset)).toBe(false);
    });
});
