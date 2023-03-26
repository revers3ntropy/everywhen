import { error } from '@sveltejs/kit';
import { Entry } from '../../lib/controllers/entry';
import { query } from '../../lib/db/mysql';
import { getAuthFromCookies } from '../../lib/security/getAuthFromCookies';
import { splitText, wordCount as txtWordCount } from '../../lib/utils/text';
import type { PageServerLoad } from './$types';

function commonWordsFromText (txt: string): [ string, number ][] {
    const words: Record<string, number> = {};
    for (let word of splitText(txt)) {
        word = word.toLowerCase();
        words[word] ??= 0;
        words[word]++;
    }
    const wordEntries = Object.entries(words);
    return wordEntries.sort(([ _, a ], [ _2, b ]) => b - a);
}

export const load: PageServerLoad = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: entries, err } = await Entry.all(query, auth, false);
    if (err) throw error(400, err);

    const entryText = entries.map((entry: Entry) => entry.entry);

    const wordCount = txtWordCount(entryText.join(' '));
    const charCount = entryText.join('').length;
    const commonWords = commonWordsFromText(entryText.join(' '));

    return {
        entries: JSON.parse(JSON.stringify(entries)),
        entryCount: entries.length,
        commonWords: commonWords.slice(0, 100),
        wordCount,
        charCount,
    };
};
