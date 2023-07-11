import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { invalidateCache } from '$lib/utils/cache.server';
import { GETParamIsTruthy } from '$lib/utils/GETArgs';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { cookieOptions, STORE_KEY } from '$lib/constants';
import { User } from '$lib/controllers/user/user';
import { query } from '$lib/db/mysql.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';

export const GET = (async ({ url, cookies }) => {
    let key: string | undefined | null = url.searchParams.get('key');
    const username: string | undefined | null = url.searchParams.get('username');
    const rememberMe = GETParamIsTruthy(url.searchParams.get('rememberMe'));

    if (!key) {
        key = cookies.get(STORE_KEY.key);
    }

    if (!key || !username) {
        throw error(401, 'Invalid login');
    }

    const { err, val: user } = await User.authenticate(query, username, key);

    if (err) throw error(401, err);

    cookies.set(STORE_KEY.key, key, cookieOptions(false, rememberMe));
    cookies.set(STORE_KEY.username, username, cookieOptions(true, rememberMe));

    return apiResponse({
        key,
        username,
        id: user.id
    });
}) satisfies RequestHandler;

export const PUT = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const { newPassword, currentPassword } = await getUnwrappedReqBody(request, {
        currentPassword: 'string',
        newPassword: 'string'
    });

    const { err } = await User.changePassword(query, auth, currentPassword, newPassword);
    if (err) throw error(400, err);

    return apiResponse({});
}) satisfies RequestHandler;

export const DELETE = (({ cookies }) => {
    cookies.delete(STORE_KEY.key, cookieOptions(false, false));
    cookies.delete(STORE_KEY.username, cookieOptions(true, false));
    return apiResponse({});
}) satisfies RequestHandler;

export const POST = apiRes404;
