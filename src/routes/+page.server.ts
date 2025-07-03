import { query } from '$lib/db/mysql.server';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    return {
        entryCount: (
            await query<{ count: number }[]>`
                SELECT count(*) as count
                FROM entries
            `
        )[0].count,
        // not sure why 'count' is coming out as a string
        wordCount:
            parseInt(
                (
                    await query<{ count: string }[]>`
                SELECT sum(wordCount) as count
                FROM entries
            `
                )[0].count
            ) || 0
    };
}) satisfies PageServerLoad;
