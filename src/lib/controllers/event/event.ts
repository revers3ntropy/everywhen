import type { Seconds, TimestampSecs } from '../../../types';
import type { Label } from '../label/label';

export interface Event {
    id: string;
    name: string;
    start: TimestampSecs;
    end: TimestampSecs;
    created: TimestampSecs;
    label: Label | null;
}

export namespace Event {
    export const NEW_EVENT_NAME = 'New Event';
    export const DEFAULT_COLOR = '#666666';

    export function duration(evt: { start: TimestampSecs; end: TimestampSecs }): Seconds {
        return evt.end - evt.start;
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

        if (evt1.start !== evt2.start) {
            return evt1.start > evt2.start;
        }

        if (evt1.end !== evt2.end) {
            return evt1.end > evt2.end;
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
        evt1: { start: TimestampSecs; end: TimestampSecs },
        evt2: { start: TimestampSecs; end: TimestampSecs }
    ): boolean {
        return (
            (evt1.start <= evt2.start && evt1.end >= evt2.start) ||
            (evt2.start <= evt1.start && evt2.end >= evt1.start)
        );
    }
}
