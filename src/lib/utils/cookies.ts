import { PUBLIC_ENV } from '$env/static/public';
import type { Seconds } from '../../types';
import { NORMAL_COOKIE_TIMEOUT_DAYS, REMEMBER_ME_COOKIE_TIMEOUT_DAYS } from '../constants';
import type { SerializeOptions } from 'cookie';

const insecureCookieEnvironments = ['dev', 'test'];

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
        secure: !insecureCookieEnvironments.includes(PUBLIC_ENV),
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

export function sessionCookieOptions(
    rememberMe: boolean
): Readonly<SerializeOptions & { path: string }> {
    return cookieOptions({ httpOnly: true, rememberMe });
}
