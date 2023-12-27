// src: https://awik.io/determine-color-bright-dark-using-javascript/
import type { CanvasState } from '$lib/components/canvas/canvasState';
import { Event } from '$lib/controllers/event/event';
import { nowUtc } from '$lib/utils/time';

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

export function addYToEvents(rawEvents: Event[]): [EventWithYLevel[], EventWithYLevel[]] {
    const evts: EventWithYLevel[] = [...rawEvents]
        .sort((e1, e2) => (Event.compare(e1, e2) ? 1 : -1))
        .map(e => ({ ...e, yLevel: 0 }));

    const instantEvents = [];
    const durationEvents = [];

    for (const event of evts) {
        if (Event.isInstantEvent(event)) {
            instantEvents.push(event);
            continue;
        }

        const overlappedLargerEvents = evts.filter(
            e => e !== event && Event.intersects(e, event) && Event.compare(e, event)
        );

        for (const e of overlappedLargerEvents) {
            e.yLevel = Math.max(e.yLevel, event.yLevel + 1);
        }

        durationEvents.push(event);
    }

    return [instantEvents, durationEvents];
}

export function getInitialZoomAndPos(
    state: CanvasState,
    entries: { created: number }[],
    events: Event[]
): [number, number] {
    let earliestTimestamp = Infinity;
    for (const entry of entries) {
        earliestTimestamp = Math.min(earliestTimestamp, entry.created);
    }
    for (const event of events) {
        earliestTimestamp = Math.min(earliestTimestamp, event.start);
    }
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
        state.cameraOffsetForTime()
    ];
}
