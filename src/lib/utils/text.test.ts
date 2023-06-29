import { cryptoRandomStr } from './text';
import { describe, it, expect } from 'vitest';

describe('cryptoRandomStr', () => {
    it('generates different strings each time', () => {
        expect(cryptoRandomStr()).not.toBe(cryptoRandomStr());
    });
});
