import { error } from '@sveltejs/kit';
import { Entry } from '../../../lib/controllers/entry';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { splitText } from '../../../lib/utils/text';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies, params }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: entries, err } = await Entry.all(query, auth, false);
    if (err) throw error(400, err);

    const theWord = params.word.toLowerCase();

    const filteredEntries: (Entry & { instancesOfWord: number })[] = [];
    const entriesForBarChart: Entry[] = [];
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
        filteredEntries.push({
            ...entry,
            instancesOfWord: instancesInEntry,
        });
        entriesForBarChart.push({
            ...entry,
            // just repeat something so that it looks like the word count
            // is the same as the number of instances of the word,
            // which is what you want to see in the bar chart
            entry: 'a '.repeat(instancesInEntry),
        });
    }

    return {
        entries: JSON.parse(JSON.stringify(filteredEntries)),
        wordCount,
        charCount,
        wordInstances,
        theWord,
        entriesForBarChart: JSON.parse(JSON.stringify(entriesForBarChart)),
    };
}) satisfies PageServerLoad;
