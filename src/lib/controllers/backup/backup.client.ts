import { Entry } from '$lib/controllers/entry/entry.client';
import { SemVer } from '$lib/utils/semVer';
import { download as downloadFile } from '../../utils/files';
import { Result } from '$lib/utils/result';
import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
import type { Backup as _Backup } from './backup';

export type Backup = _Backup;

namespace BackupUtils {
    export function migrate(json: Partial<Backup> & Record<string, unknown>): Result<Backup> {
        json.appVersion ||= '0.0.0';
        const { val: version, err } = SemVer.fromString(json.appVersion);
        if (err) return Result.err(err);

        if (version.isGreaterThan(SemVer.fromString('1.0.0').val, true)) {
            return Result.err(`Cannot time travel to version 1`);
        }

        if (version.isLessThan(SemVer.fromString('0.4.72').val)) {
            // entry.deleted -> entry.flags
            if (json.entries) {
                for (const entry of json.entries) {
                    const e: typeof entry & { deleted?: boolean } = entry;
                    e.flags ??= Entry.Flags.NONE;
                    if (e.deleted) {
                        e.flags |= Entry.Flags.DELETED;
                    }
                    delete e.deleted;
                }
            }
        }

        return Result.ok(json as Backup);
    }

    export function download(data: string, username: string, encrypted: boolean): void {
        const dateFmt = fmtUtc(nowUtc(), currentTzOffset(), 'yyyyMMDD-HHmm');
        const encryptedExt = encrypted ? '.encrypted' : '';
        downloadFile(`${dateFmt}-${username}.backup${encryptedExt}.json`, data);
    }
}

export const Backup = BackupUtils;
