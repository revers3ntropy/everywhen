import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import {
    AUTH_COOKIE_OPTIONS,
    KEY_COOKIE_KEY,
    USERNAME_COOKIE_KEY,
} from '../../../lib/constants';
import { User } from '../../../lib/controllers/user';
import { query } from '../../../lib/db/mysql';
import { getUnwrappedReqBody } from '../../../lib/utils';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const body = await getUnwrappedReqBody(request, {
        username: 'string',
        password: 'string',
    });

    const { err } = await User.create(query, body.username, body.password);
    if (err) throw error(400, err);

    cookies.set(KEY_COOKIE_KEY, body.password, AUTH_COOKIE_OPTIONS);
    cookies.set(USERNAME_COOKIE_KEY, body.username, AUTH_COOKIE_OPTIONS);

    return new Response(JSON.stringify({}), { status: 200 });
};
