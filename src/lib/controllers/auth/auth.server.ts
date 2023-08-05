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
    }

    const sessions = new Map<string, Session>();

    export function getSession(id: string): Session | undefined {
        return sessions.get(id);
    }

    export function tryGetAuthFromCookies(cookie: Cookies): Auth | null {
        const session = cookie.get(COOKIE_KEYS.sessionId);
        if (!session) return null;
        return Auth.Server.getSession(session) ?? null;
    }

    export function getAuthFromCookies(cookie: Cookies): Auth {
        const user = tryGetAuthFromCookies(cookie);
        if (!user) throw error(401, 'Invalid authentication');
        return user;
    }

    export async function authenticateUserFromLogIn(
        username: string,
        key: string
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
            id: sessionId,
            username,
            key,
            created: nowUtc()
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
