import { obfuscate } from './text';
import { describe, it, expect } from 'vitest';

describe('cryptoRandomStr', () => {
    it('generates different strings each time', () => {
        const text = 'hello world';
        expect(text).not.toBe(obfuscate(text));
    });
});
