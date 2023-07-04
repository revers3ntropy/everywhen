import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { KEY_COOKIE_OPTIONS, STORE_KEY, USERNAME_COOKIE_OPTIONS } from '$lib/constants';
import { User } from '$lib/controllers/user/user';
import { query } from '$lib/db/mysql.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse';

export const GET = (async ({ url, cookies }) => {
    let key: string | undefined | null = url.searchParams.get('key');
    const username: string | undefined | null = url.searchParams.get('username');

    if (!key) {
        key = cookies.get(STORE_KEY.key);
    }

    if (!key || !username) {
        throw error(401, 'Invalid login');
    }

    const { err, val: user } = await User.authenticate(query, username, key);

    if (err) throw error(401, err);

    cookies.set(STORE_KEY.key, key, KEY_COOKIE_OPTIONS);
    cookies.set(STORE_KEY.username, username, USERNAME_COOKIE_OPTIONS);

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
    cookies.delete(STORE_KEY.key, KEY_COOKIE_OPTIONS);
    cookies.delete(STORE_KEY.username, USERNAME_COOKIE_OPTIONS);
    return apiResponse({});
}) satisfies RequestHandler;

export const POST = apiRes404;
