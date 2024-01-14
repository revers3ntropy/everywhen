import { Label } from '$lib/controllers/label/label.server';
import { Location } from '$lib/controllers/location/location.server';
import { Day } from '$lib/utils/day';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { daysSince } from '$lib/utils/time';
import { error } from '@sveltejs/kit';
import { cachedPageRoute } from '$lib/utils/cache.server';
import { normaliseWordForIndex } from '$lib/utils/text';
import { heatMapDataFromEntries } from '../helpers';
import type { PageServerLoad } from './$types';
import { Entry } from '$lib/controllers/entry/entry.server';

export const load = cachedPageRoute(async (auth, { params }) => {
    const normalisedEncryptedWord = encrypt(
        normaliseWordForIndex(decrypt(params.word, auth.key).unwrap(e => error(400, e))),
        auth.key
    );

    const summaries = await Entry.basicSummariesForEntriesWithWord(auth, normalisedEncryptedWord);
    const days = summaries.length > 0 ? daysSince(summaries[summaries.length - 1].created, 0) : 0;

    return {
        entries: summaries,
        wordInstances: await Entry.wordCountForEncryptedWord(auth, normalisedEncryptedWord),
        theWord: normalisedEncryptedWord,
        totalEntries: (await Entry.counts(auth)).entryCount,
        locations: (await Location.all(auth)).unwrap(e => error(400, e)),
        heatMapData: heatMapDataFromEntries(summaries),
        labels: (await Label.allIndexedById(auth)).unwrap(e => error(400, e)),
        days,
        dayOfFirstEntryWithWord: Day.fromTimestamp(
            summaries[summaries.length - 1].created,
            summaries[summaries.length - 1].createdTzOffset
        ).fmtIso()
    };
}) satisfies PageServerLoad;
