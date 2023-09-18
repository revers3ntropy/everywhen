import { describe, it, expect } from 'vitest';
import {
    recursivelyTrimAndStringify,
    roundToDecimalPlaces,
    splitEntryIntoWordsForIndexing,
    wordCount
} from './text';

describe('wordCount', () => {
    it('Splits words correctly', () => {
        expect(wordCount('')).toBe(0);
        expect(wordCount(' ')).toBe(0);
        expect(wordCount(' -')).toBe(0);
        expect(wordCount('hi')).toBe(1);
        expect(wordCount('hello!')).toBe(1);
        expect(wordCount(`there's`)).toBe(1);
        expect(wordCount(`there's not a thing`)).toBe(4);
        expect(wordCount(`there's not a thing!`)).toBe(4);
        expect(wordCount(`there's not-like a thing!`)).toBe(5);
        expect(wordCount(`Although, I'd say...`)).toBe(3);
        expect(wordCount(`Although, I'd say...`)).toBe(3);
        expect(wordCount(`Although, I'd say ...`)).toBe(3);
        expect(wordCount(`yes   a       !`)).toBe(2);
    });
});

describe('recursivelyTrimAndStringify', () => {
    it('works', () => {
        const s = recursivelyTrimAndStringify;
        expect(s('')).toBe(`''`);
        expect(s('1234567890123')).toBe(`'1234567890'..3`);
        expect(s('12345678901234')).toBe(`'1234567890'..4`);
        expect(s([])).toBe('[]');
        expect(s([1, '', ['hi']])).toBe(`[1, '', ['hi']]`);
        expect(s([[1, 2, 3]], 2, 2)).toBe(`[[1, 2, ..1]]`);
        expect(s({})).toBe('{ }');
        expect(s({ a: { b: 1, c: 2, d: 3 } }, 2, 2)).toBe('{ a: { b: 1, c: 2, ..1 } }');
    });
});

describe('roundToDecimalPlaces', () => {
    it('works', () => {
        expect(roundToDecimalPlaces(1.2345)).toBe(1.2);
        expect(roundToDecimalPlaces(1)).toBe(1.0);
    });
});

describe('splitEntryIntoWordsForIndexing', () => {
    const s = splitEntryIntoWordsForIndexing;
    it('works', () => {
        expect(s('hi')).toEqual(['hi']);
        expect(s('hi there')).toEqual(['hi', 'there']);
        expect(s("there's this thing")).toEqual(['theres', 'this', 'thing']);
        expect(s('hi there, how are you?')).toEqual(['hi', 'there', 'how', 'are', 'you']);
        expect(s('abcd1234       a/c')).toEqual(['abcd1234', 'ac']);
    });
});
