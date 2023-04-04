import { error } from '@sveltejs/kit';
import { Entry } from '../../../lib/controllers/entry';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { GETParamIsTruthy } from '../../../lib/utils/GETArgs';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, cookies, url }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: entry, err } = await Entry.fromId(
        query, auth,
        params.entryId, false,
    );
    if (err) throw error(404, 'Entry not found');

    return {
        entry: JSON.parse(JSON.stringify(entry)) as {},
        history: GETParamIsTruthy(url.searchParams.get('history')),
    };

}) satisfies PageServerLoad;
