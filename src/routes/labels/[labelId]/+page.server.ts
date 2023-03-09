import { error } from '@sveltejs/kit';
import { api } from '../../../lib/api/apiQuery';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    const labelId = params.labelId;
    if (!labelId) throw error(404, 'Not found');

    const { err, val: label } =
        await api.get(auth, `/labels/${labelId}`);
    if (err) throw error(400, err);

    const { err: entryErr, val: entries } =
        await api.get(auth, `/entries`, { labelId });
    if (entryErr) throw error(400, entryErr);

    return {
        label,
        entryCount: entries.totalEntries,
    };
};
