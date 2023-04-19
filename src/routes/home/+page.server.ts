import { error } from '@sveltejs/kit';
import { Entry } from '../../lib/controllers/entry';
import { query } from '../../lib/db/mysql';
import { cachedPageRoute } from '../../lib/utils/cache';
import type { PageServerLoad } from './$types';

const NUMBER_OF_ENTRY_TITLES = 10;

export const load: PageServerLoad = cachedPageRoute(async (auth, {}) => {
    const { val: entries, err } = await Entry.getTitles(query, auth);
    if (err) throw error(400, err);

    const groupedTitles = Entry.groupEntriesByDay(
        JSON.parse(JSON.stringify(entries)) as Entry[],
    );

    let i = 0;
    const titles = Object
        .keys(groupedTitles)
        .sort((a, b) => parseInt(b) - parseInt(a))
        .reduce((acc, key) => {
            if (i >= NUMBER_OF_ENTRY_TITLES) return acc;
            i += groupedTitles[parseInt(key)].length;
            const entries = groupedTitles[parseInt(key)];
            return {
                ...acc,
                [key]: JSON.parse(JSON.stringify(entries)),
            };
        }, {});

    return {
        titles,
        entries,
    };
});