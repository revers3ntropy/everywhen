import { Entry } from '$lib/controllers/entry';
import { SemVer } from '$lib/utils/semVer';
import { encrypt } from '../security/encryption';
import { download as downloadFile } from '../utils/files';
import { Result } from '../utils/result';
import { currentTzOffset, fmtUtc, nowUtc } from '../utils/time';
import type { Auth } from './user';
import type { Backup as _Backup } from './backup';
export type Backup = _Backup;

namespace BackupUtils {
    export function asEncryptedString(self: Backup, auth: Auth): Result<string> {
        return encrypt(JSON.stringify(self), auth.key);
    }

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
