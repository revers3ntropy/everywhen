import { error } from '@sveltejs/kit';
import { api } from '../../lib/api/apiQuery';
import type { Entry } from '../../lib/controllers/entry';
import { getAuthFromCookies } from '../../lib/security/getAuthFromCookies';
import { wordCount as txtWordCount } from '../../lib/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const {
        err, val: {
            entries,
            totalEntries,
        },
    } = await api.get(auth, '/entries');
    if (err) throw error(400, err);

    const entryText = entries.map((entry: Entry) => entry.entry);

    const wordCount = txtWordCount(entryText.join(' '));
    const charCount = entryText.join('').length;

    return {
        entries,
        entryCount: totalEntries,
        wordCount,
        charCount,
    };
};
