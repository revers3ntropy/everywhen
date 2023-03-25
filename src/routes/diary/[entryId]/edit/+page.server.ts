import { error } from '@sveltejs/kit';
import { Entry } from '../../../../lib/controllers/entry';
import { query } from '../../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../../lib/security/getAuthFromCookies';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: entry, err } = await Entry.fromId(
        query, auth,
        params.entryId, true,
    );
    if (err) throw error(400, err);

    return {
        entry: JSON.parse(JSON.stringify(entry)),
    };
}) satisfies PageServerLoad;
