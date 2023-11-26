import { Location } from '$lib/controllers/location/location.server';
import { decrypt, encrypt } from '$lib/utils/encryption';
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
    return {
        entries: summaries,
        wordInstances: await Entry.wordCountForEncryptedWord(auth, normalisedEncryptedWord),
        theWord: normalisedEncryptedWord,
        totalEntries: (await Entry.counts(auth)).entryCount,
        locations: (await Location.all(auth)).unwrap(e => error(400, e)),
        heatMapData: heatMapDataFromEntries(summaries)
    };
}) satisfies PageServerLoad;
