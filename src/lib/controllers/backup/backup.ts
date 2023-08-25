import { download as downloadFile } from '$lib/utils/files.client';
import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';

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
        wordCount?: number;
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

export namespace Backup {
    export function download(data: string, username: string | null, encrypted: boolean): void {
        const dateFmt = fmtUtc(nowUtc(), currentTzOffset(), 'yyyyMMDD-HHmm');
        const encryptedExt = encrypted ? '.encrypted' : '';
        const usernameExt = username ? `-${username}` : '';
        downloadFile(`${dateFmt}${usernameExt}.backup${encryptedExt}.json`, data);
    }
}
