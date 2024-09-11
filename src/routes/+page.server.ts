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
        wordCount: (
            await query<{ count: number }[]>`
                SELECT sum(wordCount) as count
                FROM entries
            `
        )[0].count
    };
}) satisfies PageServerLoad;
