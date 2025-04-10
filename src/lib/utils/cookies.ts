import { isProd, isStaging } from '$lib/utils/env';
import type { Seconds } from '../../types';
import { NORMAL_COOKIE_TIMEOUT_DAYS, REMEMBER_ME_COOKIE_TIMEOUT_DAYS } from '../constants';
import type { SerializeOptions } from 'cookie';

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
}: ICookieOptions): Readonly<SerializeOptions & { path: string }> {
    const maxAge = maxAgeFromShouldRememberMe(rememberMe);
    const expires = new Date(Math.floor(Date.now() / 1000) * 1000 + maxAge * 1000);
    return Object.freeze({
        // always try to set a secure cookie in prod
        secure: isProd() || isStaging(),
        path: '/',
        // Needed for GitHub OAuth callback to work smoothly,
        // if set to 'strict' then no cookies are sent to the callback page.
        // Not a vulnerability for session cookie:
        //  the cookie is not sent on cross-site requests, such as on requests
        //  to load images or frames, but is sent when a user is navigating to the origin
        //  site from an external site
        // (from https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
        sameSite: 'lax',
        // if true, not readable by client JS
        // https://owasp.org/www-community/HttpOnly
        httpOnly,
        expires,
        maxAge
    });
}

export function sessionCookieOptions(
    rememberMe: boolean
): Readonly<SerializeOptions & { path: string }> {
    return cookieOptions({ httpOnly: true, rememberMe });
}
