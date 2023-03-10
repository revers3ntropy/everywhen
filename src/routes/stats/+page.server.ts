import { error } from '@sveltejs/kit';
import { Entry } from '../../lib/controllers/entry';
import { query } from '../../lib/db/mysql';
import { getAuthFromCookies } from '../../lib/security/getAuthFromCookies';
import { wordCount as txtWordCount } from '../../lib/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: entries, err } = await Entry.getAll(query, auth, false);
    if (err) throw error(400, err);

    const entryText = entries.map((entry: Entry) => entry.entry);

    const wordCount = txtWordCount(entryText.join(' '));
    const charCount = entryText.join('').length;

    return {
        entries: entries.map((entry: Entry) => entry.json()),
        entryCount: entries.length,
        wordCount,
        charCount,
    };
};
