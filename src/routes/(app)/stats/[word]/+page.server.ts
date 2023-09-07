import type { EntrySummary } from '$lib/controllers/entry/entry';
import { Location } from '$lib/controllers/location/location.server';
import { decrypt } from '$lib/utils/encryption';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import { wordsFromText } from '$lib/utils/text';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    const entries = (await Entry.Server.all(auth, { deleted: false })).unwrap(e => error(400, e));
    const locations = (await Location.Server.all(auth)).unwrap(e => error(400, e));

    const theWord = decrypt(params.word, auth.key)
        .map(w => w.toLowerCase())
        .unwrap(e => error(400, e));

    const filteredEntries: EntrySummary[] = [];
    let wordInstances = 0;
    let wordCount = 0;

    for (const entry of entries) {
        const entryAsWords = [...wordsFromText(entry.title), ...wordsFromText(entry.body)];

        let instancesInEntry = 0;
        for (const word of entryAsWords) {
            if (word.toLowerCase() === theWord) {
                instancesInEntry++;
            }
        }
        if (instancesInEntry < 1) continue;

        wordInstances += instancesInEntry;
        wordCount += entryAsWords.length;

        filteredEntries.push({
            ...Entry.summaryFromEntry(entry),
            wordCount: instancesInEntry
        });
    }

    return {
        entries: filteredEntries,
        wordCount,
        wordInstances,
        theWord,
        totalEntries: entries.length,
        locations
    };
}) satisfies PageServerLoad;
