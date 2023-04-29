// src: https://awik.io/determine-color-bright-dark-using-javascript/
import type { CanvasState } from '$lib/components/canvas/canvasState';
import { Event } from '$lib/controllers/event';
import { nowUtc } from '$lib/utils/time';
import type { EntryWithWordCount } from '../stats/helpers';

const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];

export function monthIdxToName(idx: number): string {
    return monthNames[idx];
}

export type EventWithYLevel = { yLevel: number } & Event;

export function addYToEvents(
    rawEvents: Event[]
): ({ yLevel: number } & Event)[] {
    const evts: EventWithYLevel[] = rawEvents
        .sort((e1, e2) => (Event.compare(e1, e2) ? 1 : -1))
        .map(e => ({ ...e, yLevel: 0 }));

    for (const event of evts) {
        if (Event.isInstantEvent(event)) {
            continue;
        }

        const overlappedLargerEvents = evts.filter(
            e =>
                e !== event &&
                Event.intersects(e, event) &&
                Event.compare(e, event)
        );

        for (const e of overlappedLargerEvents) {
            e.yLevel = Math.max(e.yLevel, event.yLevel + 1);
        }
    }

    return evts;
}

export function cameraOffsetForNow(
    state: CanvasState,
    acrossScreen = 3 / 4
): number {
    const offset = state.cameraOffset;
    state.cameraOffset = 0;
    const nowRenderPos = state.timeToRenderPos(nowUtc(false));
    state.cameraOffset = offset;
    return nowRenderPos - state.width * acrossScreen;
}

export function getInitialZoomAndPos(
    state: CanvasState,
    entries: EntryWithWordCount[],
    events: Event[]
): [number, number] {
    const earliestTimestamp = Math.min(
        ...entries.map(e => e.created),
        ...events.map(e => e.start)
    );
    const earliestTimestampTimeAgo = nowUtc(false) - earliestTimestamp;
    const daysAgo = Math.round(
        Math.min(52, Math.max(earliestTimestampTimeAgo / (60 * 60 * 24), 0))
    );

    return [
        // zoom so that there is 1 day of blank space to the left
        // of the last entry/event,
        // except if it is more than 52 days ago,
        // then show 53 days
        1 / 60 / (daysAgo + 1),
        cameraOffsetForNow(state)
    ];
}
