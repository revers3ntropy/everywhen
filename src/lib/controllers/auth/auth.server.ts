import { Auth as _Auth } from '$lib/controllers/auth/auth';
import { migrateUser } from '$lib/controllers/user/accountMigration.server';
import type { User } from '$lib/controllers/user/user';
import { FileLogger } from '$lib/utils/log.server';
import { SemVer } from '$lib/utils/semVer';
import { type Cookies, error } from '@sveltejs/kit';
import { COOKIE_KEYS } from '$lib/constants';
import { query } from '$lib/db/mysql.server';
import { Result } from '$lib/utils/result';
import { UId } from '$lib/controllers/uuid/uuid.server';
import { nowUtc } from '$lib/utils/time';
import type { Seconds, TimestampSecs } from '../../../types';
import crypto from 'crypto';

const logger = new FileLogger('Auth');

namespace AuthServer {
    type Auth = _Auth;

    export interface Session extends Auth {
        id: string;
        username: string;
        key: string;
        created: TimestampSecs;
        expires: TimestampSecs;
    }

    const sessions = new Map<string, Readonly<Session>>();

    setInterval(() => {
        const now = nowUtc();
        for (const [sessionId, { expires }] of sessions.entries()) {
            if (expires < now) {
                sessions.delete(sessionId);
            }
        }
    }, 5 * 1000);

    /**
     * @returns the number of sessions deleted
     */
    export function invalidateAllSessionsForUser(userId: string): number {
        let deletes = 0;
        for (const [sessionId, { id }] of sessions.entries()) {
            if (id === userId) {
                deletes++;
                sessions.delete(sessionId);
            }
        }
        return deletes;
    }

    export function getSession(id: string): Session | null {
        const session = sessions.get(id);
        if (!session) return null;
        if (session.expires < nowUtc()) {
            sessions.delete(id);
            return null;
        }
        return session;
    }

    export function tryGetAuthFromCookies(cookie: Cookies): Auth | null {
        const session = cookie.get(COOKIE_KEYS.sessionId);
        if (!session) return null;
        return getSession(session);
    }

    export function getAuthFromCookies(cookie: Cookies): Auth {
        const user = tryGetAuthFromCookies(cookie);
        if (!user) throw error(401, 'Invalid authentication');
        return user;
    }

    export async function userIdFromLogIn(username: string, key: string): Promise<Result<string>> {
        const res = await query<{ id: string }[]>`
            SELECT id
            FROM users
            WHERE username = ${username}
              AND password = SHA2(CONCAT(${key}, salt), 256)
        `;
        if (res.length !== 1) {
            if (res.length !== 0) {
                await logger.error(`Got ${res.length} rows for login`, { username, res });
            }
            return Result.err('Invalid login');
        }
        return Result.ok(res[0].id);
    }

    export async function userIdAndLastVersionFromLogIn(
        username: string,
        key: string
    ): Promise<Result<{ id: string; lastVer: SemVer }>> {
        const res = await query<{ id: string; versionLastLoggedIn: string }[]>`
            SELECT id, versionLastLoggedIn
            FROM users
            WHERE username = ${username}
              AND password = SHA2(CONCAT(${key}, salt), 256)
        `;
        if (res.length !== 1) {
            return Result.err('Invalid login');
        }
        return SemVer.fromString(res[0].versionLastLoggedIn).map(lastVer => ({
            id: res[0].id,
            lastVer
        }));
    }

    async function generateSessionId() {
        return `${await UId.generate()}-${crypto.randomBytes(32).toString('hex')}-${Date.now()}`;
    }

    export async function authenticateUserFromLogIn(
        username: string,
        key: string,
        expireAfter: Seconds
    ): Promise<Result<string>> {
        const userDetailsRes = await userIdAndLastVersionFromLogIn(username, key);
        if (!userDetailsRes.ok) return userDetailsRes.cast();

        const sessionId = await generateSessionId();

        const now = nowUtc();

        const session: Readonly<Session> = Object.freeze({
            id: userDetailsRes.val.id,
            username,
            key,
            created: now,
            expires: now + expireAfter
        });

        const user: User = {
            id: session.id,
            username: session.username,
            key,
            versionLastLoggedIn: userDetailsRes.val.lastVer
        };

        // normally very quick, but might be very slow if they haven't logged in for ages...
        // should really do all the time, but as all sessions must be regenerated after
        // a version bump, they must re-login anyway
        const res = await migrateUser(user);
        if (!res.ok) return res.cast();

        sessions.set(sessionId, session);

        return Result.ok(sessionId);
    }
}

export const Auth = {
    ..._Auth,
    ...AuthServer
};

export type Auth = _Auth;
