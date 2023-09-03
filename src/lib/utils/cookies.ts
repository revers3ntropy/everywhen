import type { Seconds } from '../../types';
import { NORMAL_COOKIE_TIMEOUT_DAYS, REMEMBER_ME_COOKIE_TIMEOUT_DAYS } from '../constants';
import type { CookieSerializeOptions } from 'cookie';

interface ICookieOptions {
    rememberMe: boolean;
    httpOnly: boolean;
}

export function maxAgeFromShouldRememberMe(rememberMe: boolean): Seconds {
    const maxAgeDays = rememberMe ? REMEMBER_ME_COOKIE_TIMEOUT_DAYS : NORMAL_COOKIE_TIMEOUT_DAYS;
    return maxAgeDays * 24 * 60 * 60;
}

export function cookieOptions({
    rememberMe,
    httpOnly
}: ICookieOptions): Readonly<CookieSerializeOptions> {
    const maxAge = maxAgeFromShouldRememberMe(rememberMe);
    const expires = new Date(Math.floor(Date.now() / 1000) * 1000 + maxAge * 1000);
    return Object.freeze({
        secure: true,
        path: '/',
        // Needed for GitHub OAuth callback to work smoothly,
        // if set to 'strict' then no cookies are sent to the callback page
        sameSite: 'lax',
        // if true, not readable by client JS
        // https://owasp.org/www-community/HttpOnly
        httpOnly,
        expires,
        maxAge
    });
}

export function sessionCookieOptions(rememberMe: boolean): Readonly<CookieSerializeOptions> {
    return cookieOptions({ httpOnly: true, rememberMe });
}
