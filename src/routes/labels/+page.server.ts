import { error } from '@sveltejs/kit';
import { Label } from '../../lib/controllers/label';
import { query } from '../../lib/db/mysql';
import { getAuthFromCookies } from '../../lib/security/getAuthFromCookies';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { err, val: labels } = await Label.allWithCounts(query, auth);
    if (err) throw error(400, err);

    return {
        labels: JSON.parse(JSON.stringify(labels)),
    };
};