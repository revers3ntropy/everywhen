import * as client from './event.client';
import * as server from './event.server';
import type { Label } from '../label/label';

// RawEvent is the raw data from the database,
// Event is the data after decryption and links to labels
export type RawEvent = Omit<Event, 'label' | 'decrypted'> & {
    label?: string;
    decrypted: false;
};

export interface Event {
    id: string;
    name: string;
    start: TimestampSecs;
    end: TimestampSecs;
    created: TimestampSecs;
    label?: Label;
}

export const Event = {
    ...server.Event,
    ...client.Event
};
