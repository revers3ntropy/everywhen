import { Location } from '$lib/controllers/location/location.server';
import { query } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { error } from '@sveltejs/kit';
import { cachedPageRoute } from '$lib/utils/cache.server';
import { normaliseWordForIndex } from '$lib/utils/text';
import { heatMapDataFromEntries } from '../helpers';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    const theWordDecrypted = normaliseWordForIndex(
        decrypt(params.word, auth.key)
            .map(w => w.toLowerCase())
            .unwrap(e => error(400, e))
    );

    const theWord = encrypt(theWordDecrypted, auth.key);

    const locations = (await Location.all(auth)).unwrap(e => error(400, e));

    const [{ entryCount }] = await query<{ entryCount: number }[]>`
        SELECT COUNT(*) as entryCount
        FROM entries
        WHERE userId = ${auth.id}
        AND deleted IS NULL
    `;

    const [{ wordInstances }] = await query<{ wordInstances: number }[]>`
        SELECT SUM(count) as wordInstances
        FROM wordsInEntries
        WHERE userId = ${auth.id}
        AND word = ${theWord}
        AND count > 0
        AND entryIsDeleted = 0
    `;

    const summaries = await query<
        {
            created: number;
            createdTzOffset: number;
            wordCount: number;
            agentData: string;
        }[]
    >`
        SELECT
            entries.created,
            entries.createdTzOffset,
            entries.agentData,
            wordsInEntries.count as wordCount
        FROM entries, wordsInEntries
        WHERE entries.deleted IS NULL
            AND entries.userId = ${auth.id}
            AND wordsInEntries.word = ${theWord}
            AND wordsInEntries.entryId = entries.id
        ORDER BY entries.created DESC, entries.id
    `.then(summaries => {
        return summaries.map(e => ({
            ...e,
            agentData: decrypt(e.agentData, auth.key).unwrap(e => error(400, e))
        }));
    });

    const heatMapData = heatMapDataFromEntries(summaries);

    return {
        entries: summaries,
        wordInstances,
        theWord,
        totalEntries: entryCount,
        locations,
        heatMapData
    };
}) satisfies PageServerLoad;
