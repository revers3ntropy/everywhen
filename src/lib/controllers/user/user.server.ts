import { Backup } from '$lib/controllers/backup/backup.server';
import { query } from '$lib/db/mysql.server';
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

export namespace UserServer {
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
    ): Promise<Result<null>> {
        if (username.length < 3) {
            return Result.err('Username must be at least 3 characters');
        }
        if (password.length < 8) {
            return Result.err('Password must be at least 8 characters');
        }

        if (username.length > 128) {
            return Result.err('Username must be less than 128 characters');
        }

        if (await userExistsWithUsername(username)) {
            return Result.err('Username already in use');
        }

        return Result.ok(null);
    }

    export async function create(username: string, password: string): Promise<Result<User>> {
        const { err } = await newUserIsValid(username, password);
        if (err) return Result.err(err);

        const salt = await generateSalt();
        const id = await UId.Server.generate();

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
        await Label.Server.purgeAll(auth);
        await Entry.Server.purgeAll(auth);
        await Asset.Server.purgeAll(auth);
        await Event.Server.purgeAll(auth);
        await Settings.Server.purgeAll(auth);
        Auth.Server.invalidateAllSessionsForUser(auth.id);

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

        const newAuth = {
            ...auth,
            key: newKey
        };

        const { val: backup, err: generateErr } = await Backup.Server.generate(auth);
        if (generateErr) return Result.err(generateErr);

        const encryptedBackup = Backup.Server.asEncryptedString(backup, auth.key);

        Auth.Server.invalidateAllSessionsForUser(auth.id);

        await query`
            UPDATE users
            SET password = SHA2(CONCAT(${newKey}, salt), 256)
            WHERE id = ${auth.id}
        `;

        const { err } = await Backup.Server.restore(newAuth, encryptedBackup, auth.key);
        if (err) return Result.err(err);

        return await Settings.Server.changeEncryptionKeyInDB(auth, newKey);
    }
}

export const User = {
    Server: UserServer
};

export type User = _User;
