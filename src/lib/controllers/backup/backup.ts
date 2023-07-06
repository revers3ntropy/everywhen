import * as server from './backup.server';
import * as client from './backup.client';

export interface Backup {
    entries: {
        title: string;
        label?: string; // label's name
        entry: string;
        latitude?: number;
        longitude?: number;
        created: number;
        createdTZOffset: number;
        agentData?: string;
        flags?: number;
        edits: {
            title: string;
            label?: string; // label's name
            entry: string;
            latitude?: number;
            longitude?: number;
            created: number;
            createdTZOffset: number;
            agentData?: string;
        }[];
    }[];
    labels: {
        name: string;
        color: string;
        created: number;
    }[];
    assets: {
        publicId: string;
        fileName: string;
        content: string;
        created: number;
    }[];
    events: {
        name: string;
        label?: string; // label's name
        start: number;
        end: number;
        created: number;
    }[];
    locations: {
        created: number;
        createdTZOffset: number;
        name: string;
        latitude: number;
        longitude: number;
        radius: number;
    }[];
    created: number;
    appVersion: string;
}

export const Backup = {
    ...server.Backup,
    ...client.Backup
};
