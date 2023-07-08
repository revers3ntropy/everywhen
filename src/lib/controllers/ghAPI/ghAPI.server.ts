import { GITHUB_AUTH_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_GITHUB_AUTH_CLIENT_ID } from '$env/static/public';
import { type Auth, User } from '$lib/controllers/user/user';
import type { QueryFunc } from '$lib/db/mysql.server';
import { errorLogger } from '$lib/utils/log.server';
import { Result } from '$lib/utils/result';

export interface GitHubUser {
    id: string;
    username: string;
}

export namespace ghAPI {
    export async function getGitHubOAuthAccessToken(
        code: string,
        state: string
    ): Promise<Result<string>> {
        if (!state || !code) {
            return Result.err('Invalid state or code');
        }

        let accessTokenRes: Response;
        try {
            accessTokenRes = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                body: JSON.stringify({
                    client_id: PUBLIC_GITHUB_AUTH_CLIENT_ID,
                    client_secret: GITHUB_AUTH_CLIENT_SECRET,
                    code,
                    state
                }),
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                }
            });
        } catch (e) {
            await errorLogger.error(e);
            return Result.err('Error connecting to GitHub');
        }

        let accessTokenData: unknown;
        try {
            accessTokenData = await accessTokenRes.json();
        } catch (e) {
            await errorLogger.error(e);
            await errorLogger.error(await accessTokenRes.text());
            return Result.err('Invalid response from gitHub');
        }

        if (typeof accessTokenData !== 'object' || !accessTokenData) {
            await errorLogger.error(`Invalid response from github`, accessTokenData);
            return Result.err('Invalid response from gitHub');
        }

        if ('error' in accessTokenData && accessTokenData.error) {
            return Result.err(accessTokenData.error.toString());
        }
        if (
            !('token_type' in accessTokenData) ||
            typeof accessTokenData.token_type !== 'string' ||
            accessTokenData.token_type.toLowerCase() !== 'bearer'
        ) {
            await errorLogger.error(`Invalid token type from github`, accessTokenData);
            return Result.err('Invalid response from gitHub');
        }

        if (
            !('access_token' in accessTokenData) ||
            typeof accessTokenData.access_token !== 'string'
        ) {
            await errorLogger.error(`No access token from github`, accessTokenData);
            return Result.err('Invalid response from GitHub');
        }

        return Result.ok(accessTokenData.access_token);
    }

    export async function linkToGitHubOAuth(
        query: QueryFunc,
        auth: Auth,
        code: string,
        state: string
    ): Promise<Result<string>> {
        const { err, val: accessToken } = await getGitHubOAuthAccessToken(code, state);
        if (err) return Result.err(err);

        const { err: saveErr } = await User.saveGitHubOAuthAccessToken(query, auth, accessToken);
        if (saveErr) return Result.err(saveErr);

        return Result.ok(accessToken);
    }

    async function makeGhApiReq(
        accessToken: string,
        path: string,
        method = 'GET'
    ): Promise<Result<object>> {
        let res;
        try {
            res = await fetch(`https://api.github.com/${path}`, {
                method,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/json'
                }
            });
        } catch (e) {
            await errorLogger.error(e);
            return Result.err('Error connecting to GitHub');
        }

        let data;
        try {
            data = await res.json();
        } catch (e) {
            await errorLogger.error(e);
            await errorLogger.error(await res.text());
            return Result.err('Invalid response from gitHub');
        }

        if (typeof data !== 'object' || !data) {
            await errorLogger.error(`Invalid response from github`, data);
            return Result.err('Invalid response from gitHub');
        }

        if ('error' in data && data.error) {
            return Result.err(data.error.toString());
        }

        return Result.ok(data);
    }

    export async function getGhUserInfo(auth: User): Promise<Result<GitHubUser>> {
        if (!auth.ghAccessToken) return Result.err('No GitHub account is linked');
        const { err, val } = await makeGhApiReq(auth.ghAccessToken, '/user');
        if (err) return Result.err(err);
        if (!('login' in val) || typeof val.login !== 'string') {
            return Result.err('Invalid response from GitHub');
        }
        if (!('id' in val) || typeof val.id !== 'string') {
            return Result.err('Invalid response from GitHub');
        }
        return Result.ok({ username: val.login, id: val.id });
    }
}
