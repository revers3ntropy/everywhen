import { error } from '@sveltejs/kit';
import { Entry } from '../../lib/controllers/entry';
import { query } from '../../lib/db/mysql';
import { getAuthFromCookies } from '../../lib/security/getAuthFromCookies';
import { splitText, wordCount as txtWordCount } from '../../lib/utils/text';
import type { PageServerLoad } from './$types';
import { daysSince, nowS } from "../../lib/utils/time";

function commonWordsFromText (
    txt: string,
    words: Record<string, number> = {}
): Record<string, number> {
    for (let word of splitText(txt)) {
        word = word.toLowerCase();
        words[word] ??= 0;
        words[word]++;
    }
    return words;
}

export const load = (async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: entries, err } = await Entry.all(query, auth, false);
    if (err) throw error(400, err);

    let earliestEntryTimeStamp = nowS();

    const entryText = entries.map((entry: Entry) => {
        if (entry.created < earliestEntryTimeStamp) {
            earliestEntryTimeStamp = entry.created;
        }
        return entry.entry;
    });

    let wordCount = 0;
    let charCount = 0;
    let commonWords: Record<string, number> = {};
    for (const entry of entryText) {
        wordCount += txtWordCount(entry);
        charCount += entry.length;
        commonWords = commonWordsFromText(entry, commonWords);
    }

    let commonWordsArr = Object.entries(commonWords)
        .sort(([ _, a ], [ _2, b ]) => b - a)
        .slice(0, 100);

    return {
        entries: JSON.parse(JSON.stringify(entries)),
        entryCount: entries.length,
        commonWords: commonWordsArr,
        days: daysSince(earliestEntryTimeStamp),
        wordCount,
        charCount,
    };
}) satisfies PageServerLoad;
