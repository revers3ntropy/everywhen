import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry';
import { query } from '$lib/db/mysql';
import { cachedPageRoute } from '$lib/utils/cache';
import { wordCount as txtWordCount } from '$lib/utils/text';
import { daysSince, nowUtc } from '$lib/utils/time';
import type { PageServerLoad } from './$types';
import { commonWordsFromText, type EntryWithWordCount } from './helpers';

export const load = cachedPageRoute(async auth => {
    const { val: entries, err } = await Entry.all(query, auth, {
        deleted: false
    });
    if (err) throw error(400, err);

    let earliestEntryTimeStamp = nowUtc();

    const entriesWithWordCount: EntryWithWordCount[] = [];
    let wordCount = 0;
    let charCount = 0;
    let commonWords: Record<string, number> = {};
    for (const entry of entries) {
        if (entry.created < earliestEntryTimeStamp) {
            earliestEntryTimeStamp = entry.created;
        }
        const entryWordCount = txtWordCount(entry.entry) + txtWordCount(entry.title);
        wordCount += entryWordCount;
        charCount += entry.entry.length + entry.title.length;
        commonWords = commonWordsFromText(entry.entry, commonWords);
        commonWords = commonWordsFromText(entry.title, commonWords);

        const e: EntryWithWordCount = entry as EntryWithWordCount;
        e.wordCount = entryWordCount;
        delete e.entry;
        delete e.title;
        entriesWithWordCount.push(e);
    }

    return {
        entries: entriesWithWordCount,
        entryCount: entries.length,
        commonWords: Object.entries(commonWords)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 100),
        days: daysSince(earliestEntryTimeStamp),
        wordCount,
        charCount
    };
}) satisfies PageServerLoad;
