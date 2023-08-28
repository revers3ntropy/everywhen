import type { EntryTitle } from '$lib/controllers/entry/entry';
import { Entry } from '$lib/controllers/entry/entry.server';
import { error } from '@sveltejs/kit';
import { query } from '$lib/db/mysql.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset.server';

const NUMBER_OF_RECENT_TITLES = 6;

export const load = cachedPageRoute(async (auth, { parent, locals }) => {
    const { val: titles, err } = await Entry.Server.getTitles(auth, NUMBER_OF_RECENT_TITLES, 0);
    if (err) throw error(400, err);

    const firstNTitles = Entry.groupEntriesByDay(titles[0]);

    // settings set by root layout
    await parent();

    const settings = locals.settings;
    if (!settings) throw error(400, 'Settings not found');

    let nYearsAgo = {} as Record<string, EntryTitle[]>;
    if (settings.showNYearsAgoEntryTitles.value) {
        nYearsAgo = (await Entry.Server.getTitlesNYearsAgo(auth)).match(
            t => t,
            err => {
                throw error(400, err);
            }
        );
    }

    const { val: pinnedEntriesList, err: pinnedErr } = await Entry.Server.getTitlesPinned(auth);
    if (pinnedErr) throw error(400, pinnedErr);

    const { val: datasets, err: datasetsErr } = await Dataset.Server.allMetaData(
        query,
        auth,
        settings
    );
    if (datasetsErr) throw error(400, datasetsErr);

    return {
        recentTitles: firstNTitles,
        nYearsAgo,
        pinnedEntriesList,
        datasets
    };
}) satisfies PageServerLoad;
