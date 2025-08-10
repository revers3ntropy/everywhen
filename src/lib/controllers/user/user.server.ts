import { UsageLimits } from '$lib/controllers/usageLimits/usageLimits';
import { query } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { currentVersion } from '$lib/utils/semVer';
import { nowUtc } from '$lib/utils/time';
import crypto from 'crypto';
import { Entry } from '../entry/entry.server';
import { Event } from '../event/event.server';
import { Label } from '../label/label.server';
import { Settings } from '../settings/settings.server';
import type { User as _User } from './user';
import { UId } from '$lib/controllers/uuid/uuid.server';
import { Auth } from '$lib/controllers/auth/auth.server';
import { Asset } from '$lib/controllers/asset/asset.server';
import { Dataset } from '../dataset/dataset.server';
import { Location } from '../location/location.server';

namespace UserServer {
    type User = _User;

    const SALT_LENGTH = 10;

    export async function userExistsWithUsername(username: string): Promise<boolean> {
        const res = await query<Record<string, number>[]>`
            SELECT 1
            FROM users
            WHERE username = ${username}
        `;
        return res.length === 1;
    }

    export async function newUserIsValid(
        username: string,
        password: string
    ): Promise<string | true> {
        if (username.length < UsageLimits.LIMITS.user.usernameLenMin)
            return `Username must be at least ${UsageLimits.LIMITS.user.usernameLenMin} characters`;

        if (password.length < UsageLimits.LIMITS.user.passwordLenMin)
            return `Password must be at least ${UsageLimits.LIMITS.user.usernameLenMin} characters`;

        if (username.length > UsageLimits.LIMITS.user.usernameLenMax)
            return `Username must be at most ${UsageLimits.LIMITS.user.usernameLenMax} characters`;

        if (password.length > UsageLimits.LIMITS.user.passwordLenMax)
            return `Password must be at most ${UsageLimits.LIMITS.user.usernameLenMax} characters`;

        if (await userExistsWithUsername(username)) return 'Username already in use';

        return true;
    }

    export async function create(username: string, password: string): Promise<Result<User>> {
        const newUserValid = await newUserIsValid(username, password);
        if (newUserValid !== true) return Result.err(newUserValid);

        const salt = await generateSalt();
        const id = UId.generate();

        await query`
            INSERT INTO users (id, username, password, salt, created, versionLastLoggedIn)
            VALUES (${id},
                    ${username},
                    SHA2(${password + salt}, 256),
                    ${salt},
                    ${nowUtc()},
                    ${currentVersion.str()});
                   
        `;

        return Result.ok({ id, username, key: password, versionLastLoggedIn: currentVersion });
    }

    export async function purge(auth: Auth): Promise<void> {
        await Label.purgeAll(auth);
        await Entry.purgeAll(auth);
        await Asset.purgeAll(auth);
        await Event.purgeAll(auth);
        await Settings.purgeAll(auth);
        await Location.purgeAll(auth);
        Auth.invalidateAllSessionsForUser(auth.id);

        await query`
            DELETE
            FROM users
            WHERE id = ${auth.id}
        `;
    }

    async function generateSalt(): Promise<string> {
        let salt = '';
        let existingSalts: { salt: string }[];
        do {
            salt = crypto.randomBytes(SALT_LENGTH).toString('base64url');
            existingSalts = await query<{ salt: string }[]>`
                SELECT salt
                FROM users
                WHERE salt = ${salt}
            `;
        } while (existingSalts.length !== 0);

        return salt;
    }

    export async function changePassword(
        auth: Auth,
        oldPassword: string,
        newPassword: string
    ): Promise<Result<null>> {
        if (!oldPassword) return Result.err('Invalid password');

        if (newPassword.length < 5) {
            return Result.err('New password is too short');
        }

        const oldKey = Auth.encryptionKeyFromPassword(oldPassword);

        if (oldKey !== auth.key) {
            return Result.err('Current password is invalid');
        }
        if (oldPassword === newPassword) {
            return Result.err('New password is same as current password');
        }

        const newKey = Auth.encryptionKeyFromPassword(newPassword);

        // TODO update everything with new encryption

        const oldDecrypt = (a: string) => decrypt(a, oldKey);
        const newEncrypt = (a: string) => encrypt(a, newKey);

        const result = await Result.collectAsync([
            Settings.updateEncryptedFields(auth.id, oldDecrypt, newEncrypt),
            Asset.updateEncryptedFields(auth.id, oldDecrypt, newEncrypt),
            Dataset.updateDatasetEncryptedFields(auth.id, oldDecrypt, newEncrypt),
            Dataset.updateDatasetColumnsEncryptedFields(auth.id, oldDecrypt, newEncrypt),
            Entry.updateEncryptedFields(auth.id, oldDecrypt, newEncrypt),
            Event.updateEncryptedFields(auth.id, oldDecrypt, newEncrypt),
            Location.updateEncryptedFields(auth.id, oldDecrypt, newEncrypt)
        ]);
        if (!result.ok) return result.cast();

        Auth.invalidateAllSessionsForUser(auth.id);

        await query`
            UPDATE users
            SET password = SHA2(CONCAT(${newKey}, salt), 256)
            WHERE id = ${auth.id}
        `;

        return Result.ok(null);
    }
}

export const User = {
    ...UserServer
};

export type User = _User;
