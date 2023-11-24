import type { Feed as _Feed, FeedDay } from './feed';
import type { Day } from '$lib/utils/time';
import { Entry } from '$lib/controllers/entry/entry.server';
import { error } from '@sveltejs/kit';
import type { Auth } from '$lib/controllers/auth/auth';

namespace FeedServer {
    export async function getDay(auth: Auth, day: Day): Promise<FeedDay> {
        const entries = (await Entry.onDay(auth, day)).unwrap(e => error(500, e));
        const lastEntry = [...entries].sort(Entry.compareLocalTimes)[0];
        const nextDayInPast = lastEntry
            ? (await Entry.dayOfEntryBeforeThisOne(auth, lastEntry))?.fmtIso() ?? null
            : null;
        return {
            entries,
            happiness: null,
            nextDayInPast,
            day: day.fmtIso()
        } satisfies FeedDay;
    }
}

export const Feed = {
    ...FeedServer
};

export type Feed = _Feed;
export type { FeedDay };
