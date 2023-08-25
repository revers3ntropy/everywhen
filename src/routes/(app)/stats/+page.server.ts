import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import { daysSince, nowUtc } from '$lib/utils/time';
import type { PageServerLoad } from './$types';
import { commonWordsFromText, type EntryWithWordCount } from './helpers';

export const load = cachedPageRoute(async auth => {
    const { val: entries, err } = await Entry.Server.all(auth, { deleted: false });
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

        wordCount += entry.wordCount;
        charCount += entry.entry.length + entry.title.length;

        commonWords = commonWordsFromText(entry.entry, commonWords);

        commonWords = commonWordsFromText(entry.title, commonWords);

        const e: EntryWithWordCount = entry as EntryWithWordCount;
        e.wordCount = entry.wordCount;
        delete e.entry;
        delete e.title;
        entriesWithWordCount.push(e);
    }

    const commonWordsArray = Object.entries(commonWords)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 100);

    return {
        entries: entriesWithWordCount,
        entryCount: entries.length,
        commonWords: commonWordsArray,
        days: daysSince(earliestEntryTimeStamp, 0),
        wordCount,
        charCount
    };
}) satisfies PageServerLoad;
