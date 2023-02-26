import { describe, expect, test } from '@jest/globals';
import { objectMatchesSchema } from '../lib/utils';

describe('objectMatchesSchema', () => {
    const o = objectMatchesSchema;

    test('Empty cases', () => {
        expect(o({}, {})).toBe(true);
        expect(o({}, {}, {})).toBe(true);
    });

    test('Simple cases', () => {
        expect(o({ a: 1 }, { a: 'number' }))
            .toBe(true);
        expect(o({ a: 1 }, { a: 'string' }))
            .toBe(false);
        expect(o({ a: 1 }, { a: 'number' }, { a: 1 }))
            .toBe(true);
        expect(o({}, { a: 'number' }, { a: 2 }))
            .toBe(true);
    });

    test('All base types', () => {
        expect(o({ a: 1 }, { a: 'number' }))
            .toBe(true);
        expect(o({}, { a: 'number' }))
            .toBe(false);

        expect(o({ a: String() }, { a: 'string' }))
            .toBe(true);
        expect(o({ a: 'hi' }, { a: 'string' }))
            .toBe(true);
        expect(o({}, { a: 'string' }))
            .toBe(false);
        expect(o({ a: 1 }, { a: 'string' }))
            .toBe(false);
        expect(o({ a: 1.0.toString() }, { a: 'string' }))
            .toBe(true);
        expect(o({ a: null }, { a: 'string' }))
            .toBe(false);

        expect(o({ a: true }, { a: 'boolean' }))
            .toBe(true);
        expect(o({ a: false }, { a: 'boolean' }))
            .toBe(true);
        expect(o({ a: null }, { a: 'boolean' }))
            .toBe(false);
        expect(o({ a: null }, { a: 'boolean' }))
            .toBe(false);

        expect(o({ a: {} }, { a: 'object' }))
            .toBe(true);
        expect(o({ a: null }, { a: 'object' }))
            .toBe(true);
        expect(o({ a: new class {} }, { a: 'object' }))
            .toBe(true);
        expect(o({}, { a: 'object' }))
            .toBe(false);
        expect(o({ a: () => 0 }, { a: 'object' }))
            .toBe(false);
        expect(o({ a: [] }, { a: 'object' }))
            .toBe(true);
        expect(o({ a: [ {} ] }, { a: 'object' }))
            .toBe(true);
        expect(o({ a: [ [] ] }, { a: 'object' }))
            .toBe(true);

        expect(o({ a: class {} }, { a: 'function' }))
            .toBe(true);
        expect(o({ a: () => void 0 }, { a: 'function' }))
            .toBe(true);
        expect(o({ a: void 0 }, { a: 'function' }))
            .toBe(false);
        expect(o({ a: [] }, { a: 'function' }))
            .toBe(false);

        expect(o({ a: undefined }, { a: 'undefined' }))
            .toBe(true);
        expect(o({ a: void 0 }, { a: 'undefined' }))
            .toBe(true);
        expect(o({}, { a: 'undefined' }))
            .toBe(true);
    });

    test('Default Values', () => {
        expect(o({ b: null, a: undefined }, { a: 'number' }, { a: 2 }))
            .toBe(true);

        expect(o({ a: undefined }, { a: 'string' }, { a: 'hi' }))
            .toBe(true);
        expect(o({ a: null }, { a: 'string' }, { a: 'hi' }))
            .toBe(true);
        expect(o({ a: 0 }, { a: 'string' }, { a: 'hi' }))
            .toBe(false);
        expect(o({}, { a: 'undefined' }))
            .toBe(true);
        expect(o({ a: 1 }, { a: 'undefined' }))
            .toBe(false);
        expect(o({ a: 1 }, { a: 'undefined' }, { a: undefined }))
            .toBe(false);
        expect(o({ a: undefined }, { a: 'undefined' }, { a: undefined }))
            .toBe(true);

        expect(o({ a: 1, b: 2 }, { a: 'number' }))
            .toBe(true);
        expect(o({ a: 1, b: false }, { a: 'number', b: 'boolean' }))
            .toBe(true);
        expect(o({ a: 1, b: 2 }, { a: 'number', b: 'string' }))
            .toBe(false);
        expect(o({ a: 1, b: 'hi' }, { a: 'number', b: 'string', c: 'boolean' }))
            .toBe(false);
        expect(o({ b: 2 }, { a: 'number', b: 'number' }, { a: 1, b: 3 }))
            .toBe(true);
    });
});