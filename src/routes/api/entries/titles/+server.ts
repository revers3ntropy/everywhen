import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Entry } from '../../../../lib/controllers/entry';
import { query } from '../../../../lib/db/mysql';
import { apiRes404 } from '../../../../lib/utils/apiResponse';
import { cachedApiRoute } from '../../../../lib/utils/cache';

export const GET = cachedApiRoute(async (auth, {}) => {
    const { val: entries, err } = await Entry.getTitles(query, auth);
    if (err) throw error(400, err);

    return { entries };
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
