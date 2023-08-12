import { describe, it, expect } from 'vitest';
import { obfuscate, recursivelyTrimAndStringify, wordCount } from './text';

describe('obfuscate', () => {
    it('changes the string', () => {
        const text = 'hello world';
        expect(obfuscate(text)).not.toBe(text);
    });
});

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
