import { decrypt } from '$lib/utils/encryption/encryption.server';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry';
import { query } from '$lib/db/mysql.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import { wordsFromText } from '$lib/utils/text';
import type { EntryWithWordCount } from '../helpers';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    const { val: entries, err } = await Entry.all(query, auth, {
        deleted: false
    });
    if (err) throw error(400, err);

    const { err: decryptErr, val: theWord } = decrypt(params.word, auth.key).map(w =>
        w.toLowerCase()
    );
    if (decryptErr) throw error(400, decryptErr);

    const filteredEntries: EntryWithWordCount[] = [];
    let wordInstances = 0;
    let wordCount = 0;

    const totalEntries = entries.length;

    for (const entry of entries) {
        const entryAsWords = [...wordsFromText(entry.title), ...wordsFromText(entry.entry)];

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

        const e: EntryWithWordCount = entry as EntryWithWordCount;
        e.wordCount = instancesInEntry;
        delete e.entry;
        delete e.title;
        filteredEntries.push(e);
    }

    return {
        entries: filteredEntries,
        wordCount,
        wordInstances,
        theWord,
        totalEntries
    };
}) satisfies PageServerLoad;
