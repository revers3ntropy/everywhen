import { error } from '@sveltejs/kit';
import { Entry } from '../../../lib/controllers/entry';
import { Label } from '../../../lib/controllers/label';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    const labelId = params.labelId;
    if (!labelId) throw error(404, 'Not found');

    const { val: label, err } = await Label.fromId(query, auth, labelId);
    if (err) throw error(404, err);

    const { val: entries, err: entriesErr } = await Entry.getPage(
        query, auth,
        0, 1,
        { labelId },
    );
    if (entriesErr) throw error(400, entriesErr);

    return {
        label: label.json(),
        entryCount: entries[1],
    };
};
