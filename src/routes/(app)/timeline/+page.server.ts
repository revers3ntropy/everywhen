import { query } from '$lib/db/mysql.server';
import { Event } from '$lib/controllers/event/event.server';
import { Label } from '$lib/controllers/label/label.server';
import { cachedPageRoute } from '$lib/utils/cache.server';

export const load = cachedPageRoute(async auth => {
    return {
        entries: await query<
            {
                id: string;
                created: number;
                createdTzOffset: number;
                title: string;
                labelId: string;
                wordCount: number;
            }[]
        >`
            SELECT id, created, createdTzOffset, title, labelId, wordCount
            FROM entries
            WHERE userId = ${auth.id}
        `,
        events: await Event.all(auth),
        labels: await Label.allIndexedById(auth)
    };
});
