import { describe, it, expect, vi } from 'vitest';
import { maxAgeFromShouldRememberMe, cookieOptions, sessionCookieOptions } from './cookies';
import { NORMAL_COOKIE_TIMEOUT_DAYS, REMEMBER_ME_COOKIE_TIMEOUT_DAYS } from '../constants';
import * as env from '$lib/utils/env';

vi.mock('$lib/utils/env', () => ({
    isProd: vi.fn(),
    isStaging: vi.fn()
}));

describe('cookie utils', () => {
    it('maxAgeFromShouldRememberMe', () => {
        const rememberMeAge = maxAgeFromShouldRememberMe(true);
        expect(rememberMeAge).toBe(REMEMBER_ME_COOKIE_TIMEOUT_DAYS * 24 * 60 * 60);

        const normalAge = maxAgeFromShouldRememberMe(false);
        expect(normalAge).toBe(NORMAL_COOKIE_TIMEOUT_DAYS * 24 * 60 * 60);
    });

    it('cookieOptions httpOnly=true', () => {
        const options = cookieOptions({ rememberMe: false, httpOnly: true });
        expect(options.httpOnly).toBe(true);
    });

    it('cookieOptions httpOnly=false', () => {
        const options = cookieOptions({ rememberMe: false, httpOnly: false });
        expect(options.httpOnly).toBe(false);
    });

    it('cookieOptions secure in prod', () => {
        vi.mocked(env).isProd.mockReturnValue(true);
        const options = cookieOptions({ rememberMe: false, httpOnly: false });
        expect(options.secure).toBe(true);
    });

    it('cookieOptions secure in staging', () => {
        vi.mocked(env).isProd.mockReturnValue(false);
        vi.mocked(env).isStaging.mockReturnValue(true);
        const options = cookieOptions({ rememberMe: false, httpOnly: false });
        expect(options.secure).toBe(true);
    });

    it('cookieOptions not secure in dev', () => {
        vi.mocked(env).isProd.mockReturnValue(false);
        vi.mocked(env).isStaging.mockReturnValue(false);
        const options = cookieOptions({ rememberMe: false, httpOnly: false });
        expect(options.secure).toBe(false);
    });

    it('sessionCookieOptions', () => {
        const options = sessionCookieOptions(false);
        expect(options.httpOnly).toBe(true);
    });
});
