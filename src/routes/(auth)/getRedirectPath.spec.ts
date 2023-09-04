import { describe, it, expect } from 'vitest';
import { redirectPath } from './getRedirectPath.server';

describe('redirectPath', () => {
    it('works', () => {
        const cases: [string, string][] = [
            ['/login', 'home'],
            ['/login?a=b', 'home'],
            ['login', 'home'],
            ['login?a=b', 'home'],
            ['/', 'home'],
            ['', 'home'],
            ['home', 'home'],
            ['/home', 'home'],
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
