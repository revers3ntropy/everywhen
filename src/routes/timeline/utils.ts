// src: https://awik.io/determine-color-bright-dark-using-javascript/
import { Event } from '../../lib/controllers/event';

export function isLightColour (color: string): boolean {
    let r: number, g: number, b: number;

    if (color.match(/^rgb/)) {
        const c = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
        if (!c) throw new Error('Invalid color: ' + color);
        r = parseInt(c[1]);
        g = parseInt(c[2]);
        b = parseInt(c[3]);
    } else {
        const c = +('0x' + color.slice(1)
                                .replace((color.length < 5) as any && /./g, '$&$&')
        );
        r = c >> 16;
        g = c >> 8 & 255;
        b = c & 255;
    }
    const hsp = Math.sqrt(
        0.299 * (r * r) +
        0.587 * (g * g) +
        0.114 * (b * b),
    );
    return hsp > 127.5;
}

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

        let overlappedLargerEvents = evts
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