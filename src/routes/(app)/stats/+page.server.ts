import type { EntrySummary } from '$lib/controllers/entry/entry';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import { daysSince, nowUtc } from '$lib/utils/time';
import type { PageServerLoad } from './$types';
import { commonWordsFromText } from './helpers';

export const load = cachedPageRoute(async auth => {
    const { val: entries, err } = await Entry.Server.all(auth, { deleted: false });
    if (err) throw error(400, err);

    let earliestEntryTimeStamp = nowUtc();

    const entriesWithWordCount: EntrySummary[] = [];
    let wordCount = 0;
    let charCount = 0;
    let commonWords: Record<string, number> = {};
    for (const entry of entries) {
        if (entry.created < earliestEntryTimeStamp) {
            earliestEntryTimeStamp = entry.created;
        }

        wordCount += entry.wordCount;
        charCount += entry.body.length + entry.title.length;

        commonWords = commonWordsFromText(entry.body, commonWords);

        commonWords = commonWordsFromText(entry.title, commonWords);

        entriesWithWordCount.push(Entry.summaryFromEntry(entry));
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
