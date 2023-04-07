import { error } from '@sveltejs/kit';
import { Entry } from '../../../lib/controllers/entry';
import { query } from '../../../lib/db/mysql';
import { cachedPageRoute } from '../../../lib/utils/cache';
import { splitText } from '../../../lib/utils/text';
import type { EntryWithWordCount } from '../helpers';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    const { val: entries, err } = await Entry.all(query, auth, false);
    if (err) throw error(400, err);

    const theWord = params.word.toLowerCase();

    const filteredEntries: EntryWithWordCount[] = [];
    let wordInstances = 0;
    let wordCount = 0;
    let charCount = 0;

    for (const entry of entries) {
        const entryAsWords = [
            ...splitText(entry.title),
            ...splitText(entry.entry),
        ];

        let instancesInEntry = 0;
        for (const word of entryAsWords) {
            if (word.toLowerCase() === theWord) {
                instancesInEntry++;
            }
        }
        if (instancesInEntry < 1) {
            continue;
        }
        wordInstances += instancesInEntry;
        wordCount += entryAsWords.length;
        charCount += entry.entry.length;

        const e: EntryWithWordCount = entry as EntryWithWordCount;
        e.wordCount = instancesInEntry;
        delete e.entry;
        delete e.decrypted;
        delete e.title;
        filteredEntries.push(e);
    }

    return {
        entries: filteredEntries,
        wordCount,
        charCount,
        wordInstances,
        theWord,
    };
}) satisfies PageServerLoad;
