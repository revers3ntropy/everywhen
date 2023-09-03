import type { backupSchema } from '$lib/controllers/backup/backup.server';
import { download as downloadFile } from '$lib/utils/files.client';
import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
import type { z } from 'zod';

export type InferBackup = z.infer<typeof backupSchema>;
export interface Backup extends InferBackup {}

export namespace Backup {
    export function download(data: string, username: string | null, encrypted: boolean): void {
        const dateFmt = fmtUtc(nowUtc(), currentTzOffset(), 'yyyyMMDD-HHmm');
        const encryptedExt = encrypted ? '.encrypted' : '';
        const usernameExt = username ? `-${username}` : '';
        downloadFile(`${dateFmt}${usernameExt}.backup${encryptedExt}.json`, data);
    }
}
