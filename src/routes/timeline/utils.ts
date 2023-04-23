// src: https://awik.io/determine-color-bright-dark-using-javascript/
import { Event } from '../../lib/controllers/event';

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
    'Dec',
];

export function monthIdxToName (idx: number): string {
    return monthNames[idx];
}

export type EventWithYLevel = { yLevel: number } & Event;

export function addYToEvents (
    rawEvents: Event[],
): ({ yLevel: number } & Event)[] {
    const evts: EventWithYLevel[] = rawEvents
        .sort((e1, e2) => (
            Event.compare(e1, e2) ? 1 : -1
        ))
        .map(e => ({ ...e, yLevel: 0 }));

    for (const event of evts) {
        if (Event.isInstantEvent(event)) {
            continue;
        }

        const overlappedLargerEvents = evts
            .filter(e => (
                e !== event
                && Event.intersects(e, event)
                && Event.compare(e, event)
            ));

        for (const e of overlappedLargerEvents) {
            e.yLevel = Math.max(e.yLevel, event.yLevel + 1);
        }
    }

    return evts;
}