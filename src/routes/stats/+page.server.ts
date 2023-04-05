import { error } from '@sveltejs/kit';
import { Entry } from '../../lib/controllers/entry';
import { query } from '../../lib/db/mysql';
import { cachedPageRoute } from '../../lib/utils/cache';
import { wordCount as txtWordCount } from '../../lib/utils/text';
import { daysSince, nowS } from '../../lib/utils/time';
import type { PageServerLoad } from './$types';
import { commonWordsFromText } from './helpers';

export const load = cachedPageRoute(async (auth, {}) => {
    const { val: entries, err } = await Entry.all(query, auth, false);
    if (err) throw error(400, err);

    let earliestEntryTimeStamp = nowS();

    let wordCount = 0;
    let charCount = 0;
    let commonWords: Record<string, number> = {};
    for (const entry of entries) {
        if (entry.created < earliestEntryTimeStamp) {
            earliestEntryTimeStamp = entry.created;
        }
        wordCount += txtWordCount(entry.entry);
        charCount += entry.entry.length;
        commonWords = commonWordsFromText(entry.entry, commonWords);
    }

    return {
        entries: JSON.parse(JSON.stringify(entries)),
        entryCount: entries.length,
        commonWords: Object.entries(commonWords)
                           .sort(([ _, a ], [ _0, b ]) => b - a)
                           .slice(0, 100),
        days: daysSince(earliestEntryTimeStamp) || 1,
        wordCount,
        charCount,
    };
}) satisfies PageServerLoad;
