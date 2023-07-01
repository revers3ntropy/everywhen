import * as client from './location.client';
import * as server from './location.server';

export interface Location {
    id: string;
    created: TimestampSecs;
    createdTZOffset: number;
    name: string;
    latitude: Degrees;
    longitude: Degrees;
    radius: Degrees;
}

export const Location = {
    ...server.Location,
    ...client.Location
};
