import { error } from '@sveltejs/kit';
import { Entry } from '../../lib/controllers/entry';
import { Location } from '../../lib/controllers/location';
import { query } from '../../lib/db/mysql';
import { cachedPageRoute } from '../../lib/utils/cache';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, {}) => {
    const { val: entries, err } = await Entry.all(query, auth, {
        deleted: false,
    });
    if (err) throw error(400, err);

    const { err: locationErr, val: locations } = await Location.all(query, auth);
    if (locationErr) throw error(400, locationErr);

    return {
        entries: entries.map(e => ({
            created: e.created,
            id: e.id,
            latitude: e.latitude,
            longitude: e.longitude,
        })),
        locations,
    };
}) satisfies PageServerLoad;
