import { GITHUB_AUTH_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_GITHUB_AUTH_CLIENT_ID } from '$env/static/public';
import { Settings } from '$lib/controllers/settings/settings.server';
import { FileLogger } from '$lib/utils/log.server';
import { Result } from '$lib/utils/result';
import type { Auth } from '$lib/controllers/auth/auth';
import { z } from 'zod';

const logger = new FileLogger('GHOAuth');

export interface GitHubUser {
    id: number;
    username: string;
}

export namespace ghAPI {
    export async function getGitHubOAuthAccessToken(
        code: string,
        state: string
    ): Promise<Result<string>> {
        if (!state || !code) {
            void logger.warn('Invalid state or code', { state, code });
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
        } catch (error) {
            await logger.error('Error connecting to GitHub /login/oauth/access_token', { error });
            return Result.err('Error connecting to GitHub');
        }

        let accessTokenData: unknown;
        try {
            accessTokenData = await accessTokenRes.json();
        } catch (error) {
            await logger.error('Invalid response from gitHub /login/oauth/access_token', {
                accessTokenRes,
                accessTokenData,
                accessTokenResText: await accessTokenRes.text(),
                code,
                state
            });
            return Result.err('Invalid response from gitHub');
        }

        if (typeof accessTokenData !== 'object' || !accessTokenData) {
            await logger.error(`Invalid response from github`, {
                accessTokenData,
                accessTokenRes,
                state,
                code
            });
            return Result.err('Invalid response from gitHub');
        }
        if ('error' in accessTokenData && accessTokenData.error) {
            return Result.err(JSON.stringify(accessTokenData.error));
        }

        const parseResult = z
            .object({
                token_type: z.string(),
                access_token: z.string()
            })
            .safeParse(accessTokenData);

        if (!parseResult.success || parseResult.data.token_type.toLowerCase() !== 'bearer') {
            await logger.error(`Invalid response from github`, {
                parseResult,
                accessTokenData,
                code,
                state
            });
            return Result.err('Invalid response from GitHub');
        }

        return Result.ok(parseResult.data.access_token);
    }

    export async function linkToGitHubOAuth(
        auth: Auth,
        code: string,
        state: string
    ): Promise<Result<string>> {
        const { err, val: accessToken } = await getGitHubOAuthAccessToken(code, state);
        if (err) return Result.err(err);

        const { err: saveErr } = await Settings.Server.update(
            auth,
            'gitHubAccessToken',
            accessToken
        );
        if (saveErr) return Result.err(saveErr);

        return Result.ok(accessToken);
    }

    export async function unlinkToGitHubOAuth(auth: Auth): Promise<Result<null>> {
        const { err: saveErr } = await Settings.Server.update(auth, 'gitHubAccessToken', '');
        if (saveErr) return Result.err(saveErr);
        return Result.ok(null);
    }

    async function makeGhApiReq(
        gitHubAccessToken: string | undefined,
        path: string,
        method = 'GET'
    ): Promise<Result<object>> {
        if (!gitHubAccessToken) {
            return Result.err('No GitHub account is linked');
        }
        if (!path.startsWith('/')) {
            throw new Error('makeGhApiReq: GH API request path must start with /');
        }

        let res;
        try {
            res = await fetch(`https://api.github.com${path}`, {
                method,
                headers: {
                    Authorization: `Bearer ${gitHubAccessToken}`,
                    Accept: 'application/json'
                }
            });
        } catch (error) {
            await logger.warn('makeGhApiReq: Error connecting to GitHub', {
                error,
                gitHubAccessToken,
                path,
                method
            });
            return Result.err('Error connecting to GitHub');
        }

        let data;
        try {
            data = await res.json();
        } catch (error) {
            await logger.error('makeGhApiReq: Invalid response from gitHub', {
                res,
                textRes: await res.text(),
                error
            });
            return Result.err('Invalid response from gitHub');
        }

        if (typeof data !== 'object' || !data) {
            await logger.error(`makeGhApiReq: Invalid response from github`, {
                data,
                path,
                method,
                gitHubAccessToken
            });
            return Result.err('Invalid response from gitHub');
        }

        if ('error' in data && data.error) {
            void logger.error('Error from GitHub', { data, path, method, gitHubAccessToken });
            return Result.err('Invalid response from gitHub');
        }

        return Result.ok(data);
    }

    export async function getGhUserInfo(gitHubAccessToken?: string): Promise<Result<GitHubUser>> {
        const { err, val } = await makeGhApiReq(gitHubAccessToken, '/user');
        if (err) return Result.err(err);

        if (
            !('login' in val) ||
            typeof val.login !== 'string' ||
            !('id' in val) ||
            typeof val.id !== 'number'
        ) {
            await logger.error(`getGhUserInfo: Invalid response from github`, { val });
            return Result.err('Invalid response from GitHub');
        }

        return Result.ok({ username: val.login, id: val.id });
    }
}
