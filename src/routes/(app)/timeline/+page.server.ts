import { LIMITS } from '$lib/constants';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Event } from '$lib/controllers/event/event.server';
import { Label } from '$lib/controllers/label/label.server';
import { cachedPageRoute } from '$lib/utils/cache.server';

export const load = cachedPageRoute(async auth => {
    return {
        entries: (await Entry.Server.getPageOfSummaries(auth, LIMITS.entry.maxCount + 1, 0)).unwrap(
            e => error(400, e)
        ).summaries,
        events: (await Event.Server.all(auth)).unwrap(e => error(400, e)),
        labels: (await Label.Server.all(auth)).unwrap(e => error(400, e))
    };
});
