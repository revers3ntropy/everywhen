import { Auth as _Auth } from '$lib/controllers/auth/auth';
import { type Cookies, error } from '@sveltejs/kit';
import { COOKIE_KEYS } from '$lib/constants';
import { query } from '$lib/db/mysql.server';
import { Result } from '$lib/utils/result';
import { UUIdControllerServer } from '$lib/controllers/uuid/uuid.server';
import { nowUtc } from '$lib/utils/time';

namespace AuthServer {
    type Auth = _Auth;

    export interface Session extends Auth {
        id: string;
        username: string;
        key: string;
        created: TimestampSecs;
        expires: TimestampSecs;
    }

    const sessions = new Map<string, Session>();

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
        return getSession(session) ?? null;
    }

    export function getAuthFromCookies(cookie: Cookies): Auth {
        const user = tryGetAuthFromCookies(cookie);
        if (!user) throw error(401, 'Invalid authentication');
        return user;
    }

    export async function authenticateUserFromLogIn(
        username: string,
        key: string,
        expireAfter: Seconds
    ): Promise<Result<string>> {
        const res = await query<{ id: string }[]>`
            SELECT id
            FROM users
            WHERE username = ${username}
              AND password = SHA2(CONCAT(${key}, salt), 256)
        `;
        if (res.length !== 1) {
            return Result.err('Invalid login');
        }
        const sessionId = await UUIdControllerServer.generate();

        const session: Session = {
            id: res[0].id,
            username,
            key,
            created: nowUtc(),
            expires: nowUtc() + expireAfter
        };

        sessions.set(sessionId, session);

        return Result.ok(sessionId);
    }
}

export const Auth = {
    ..._Auth,
    Server: AuthServer
};

export type Auth = _Auth;
