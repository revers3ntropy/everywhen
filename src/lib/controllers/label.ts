import * as client from './label.client';
import * as server from './label.server';

export type LabelWithCount = Label & {
    entryCount: number;
    eventCount: number;
};

export interface Label {
    id: string;
    color: string;
    name: string;
    created: number;
}

export const Label = {
    ...server.Label,
    ...client.Label
};
