import type { Hours, Seconds, TimestampSecs } from '../../../types';
import type { Label } from '../label/label';

export interface Event {
    id: string;
    name: string;
    start: TimestampSecs;
    end: TimestampSecs;
    tzOffset: Hours;
    created: TimestampSecs;
    label: Label | null;
}

export namespace Event {
    export const NEW_EVENT_NAME = 'New Event';
    export const DEFAULT_COLOR = '#666666';

    export function duration(evt: { start: TimestampSecs; end: TimestampSecs }): Seconds {
        return evt.end - evt.start;
    }

    export function localStart(evt: { start: number; tzOffset: number }): TimestampSecs {
        return evt.start + evt.tzOffset * 60 * 60;
    }

    export function localEnd(evt: { end: number; tzOffset: number }): TimestampSecs {
        return evt.end + evt.tzOffset * 60 * 60;
    }

    /**
     * Orders events against each other.
     * Used to find Y position of events in timeline.
     */
    export function compare(evt1: Event, evt2: Event): boolean {
        const evt1Duration = duration(evt1);
        const evt2Duration = duration(evt2);

        if (evt1Duration !== evt2Duration) {
            return evt1Duration > evt2Duration;
        }

        if (localStart(evt1) !== localStart(evt2)) {
            return localStart(evt1) > localStart(evt2);
        }

        if (localEnd(evt1) !== localEnd(evt2)) {
            return localEnd(evt1) > localEnd(evt2);
        }

        if (evt1.created !== evt2.created) {
            return evt1.created > evt2.created;
        }

        return evt1.id.localeCompare(evt2.id) > 0;
    }

    export function isInstantEvent(evt: { start: TimestampSecs; end: TimestampSecs }): boolean {
        return duration(evt) < 60;
    }

    export function intersects(
        evt1: { start: TimestampSecs; end: TimestampSecs; tzOffset: number },
        evt2: { start: TimestampSecs; end: TimestampSecs; tzOffset: number }
    ): boolean {
        return (
            (localStart(evt1) <= localStart(evt2) && localEnd(evt1) >= localStart(evt2)) ||
            (localStart(evt2) <= localStart(evt1) && localEnd(evt2) >= localStart(evt1))
        );
    }
}
