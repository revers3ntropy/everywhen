import { redirect } from '@sveltejs/kit';
import { Entry } from '../../../lib/controllers/entry';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: entry, err } = await Entry.fromId(
        auth, params.entryId, false);
    if (err) throw redirect(307, '/diary');

    return entry;
};
