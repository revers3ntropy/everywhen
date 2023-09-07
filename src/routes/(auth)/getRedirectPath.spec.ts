import { describe, it, expect } from 'vitest';
import { redirectPath } from './getRedirectPath.server';

const defaultPath = 'journal';

describe('redirectPath', () => {
    it('works', () => {
        const cases: [string, string][] = [
            ['/login', defaultPath],
            ['/login?a=b', defaultPath],
            ['login', defaultPath],
            ['login?a=b', defaultPath],
            ['/', defaultPath],
            ['', defaultPath],
            ['journal', 'journal'],
            ['/journal', 'journal'],
            ['/something', 'something'],
            ['a/b', 'a/b'],
            ['/a/b/c', 'a/b/c'],
            ['login?redirect=d', 'd'],
            ['login?redirect=/e', 'e'],
            [`login?redirect=login?redirect=f`, 'f']
        ];

        for (const [url, expected] of cases) {
            expect(
                redirectPath(new URL(`https://something.com?redirect=${encodeURIComponent(url)}`))
            ).toBe(expected);
        }
    });
});
