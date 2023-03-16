import { error } from '@sveltejs/kit';
import { Event } from '../../lib/controllers/event';
import { Label } from '../../lib/controllers/label';
import { query } from '../../lib/db/mysql';
import { getAuthFromCookies } from '../../lib/security/getAuthFromCookies';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: events, err } = await Event.all(query, auth);
    if (err) throw error(400, err);

    const labels = await Label.all(query, auth);

    return {
        events: events.map((event) => ({
            ...event,
            label: { ...event.label },
        })),
        labels: labels.map((label) => ({ ...label })),
    };
};