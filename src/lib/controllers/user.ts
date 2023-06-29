import type { QueryFunc } from '../db/mysql';
import { encryptionKeyFromPassword } from '../security/authUtils.server';
import { Result } from '../utils/result';
import { cryptoRandomStr } from '../utils/text';
import { nowUtc } from '../utils/time';
import { Asset } from './asset';
import { Backup } from './backup';
import { Entry } from './entry';
import { Event } from './event';
import { Label } from './label';
import { Settings } from './settings';
import { UUID } from './uuid';

export class User {
    public constructor(public id: string, public username: string, public key: string) {}

    public static async authenticate(
        query: QueryFunc,
        username: string,
        key: string
    ): Promise<Result<User>> {
        const res = await query<{ id: string }[]>`
            SELECT id
            FROM users
            WHERE username = ${username}
              AND password = SHA2(CONCAT(${key}, salt), 256)
        `;
        if (res.length !== 1) {
            return Result.err('Invalid login');
        }
        return Result.ok(new User(res[0].id, username, key));
    }

    public static async userExistsWithUsername(
        query: QueryFunc,
        username: string
    ): Promise<boolean> {
        const res = await query<Record<string, number>[]>`
            SELECT 1
            FROM users
            WHERE username = ${username}
        `;
        return res.length === 1;
    }

    public static async newUserIsValid(
        query: QueryFunc,
        username: string,
        password: string
    ): Promise<Result> {
        if (username.length < 3) {
            return Result.err('Username must be at least 3 characters');
        }
        if (password.length < 8) {
            return Result.err('Password must be at least 8 characters');
        }

        if (username.length > 128) {
            return Result.err('Username must be less than 128 characters');
        }

        if (await User.userExistsWithUsername(query, username)) {
            return Result.err('Username already in use');
        }

        return Result.ok(null);
    }

    public static async create(
        query: QueryFunc,
        username: string,
        password: string
    ): Promise<Result<User>> {
        const { err } = await User.newUserIsValid(query, username, password);
        if (err) return Result.err(err);

        const salt = await User.generateSalt(query);
        const id = await UUID.generateUUId(query);

        await query`
            INSERT INTO users (id, username, password, salt, created)
            VALUES (${id},
                    ${username},
                    SHA2(${password + salt}, 256),
                    ${salt},
                    ${nowUtc()});
        `;

        return Result.ok(new User(id, username, password));
    }

    public static async purge(query: QueryFunc, auth: Auth): Promise<void> {
        await Label.purgeAll(query, auth);
        await Entry.purgeAll(query, auth);
        await Asset.purgeAll(query, auth);
        await Event.purgeAll(query, auth);
        await Settings.purgeAll(query, auth);

        await query`
            DELETE
            FROM users
            WHERE id = ${auth.id}
        `;
    }

    private static async generateSalt(query: QueryFunc): Promise<string> {
        let salt = '';
        let existingSalts: { salt: string }[];
        do {
            salt = cryptoRandomStr(10);
            existingSalts = await query<{ salt: string }[]>`
                SELECT salt
                FROM users
                WHERE salt = ${salt}
            `;
        } while (existingSalts.length !== 0);

        return salt;
    }

    public static async changePassword(
        query: QueryFunc,
        auth: Auth,
        oldPassword: string,
        newPassword: string
    ): Promise<Result> {
        if (!oldPassword) return Result.err('Invalid password');

        if (newPassword.length < 5) {
            return Result.err('New password is too short');
        }

        const oldKey = encryptionKeyFromPassword(oldPassword);

        if (oldKey !== auth.key) {
            return Result.err('Current password is invalid');
        }

        if (oldPassword === newPassword) {
            return Result.err('New password is same as current password');
        }

        const newKey = encryptionKeyFromPassword(newPassword);

        const newAuth = {
            ...auth,
            key: newKey
        };

        const { val: backup, err: generateErr } = await Backup.generate(query, auth);
        if (generateErr) return Result.err(generateErr);

        const { err: encryptErr, val: encryptedBackup } = Backup.asEncryptedString(backup, auth);

        if (encryptErr) return Result.err(encryptErr);

        await query`
            UPDATE users
            SET password = SHA2(CONCAT(${newKey}, salt), 256)
            WHERE id = ${auth.id}
        `;

        const { err } = await Backup.restore(query, newAuth, encryptedBackup, auth.key);
        if (err) return Result.err(err);

        return await Settings.changeKey(query, auth, newKey);
    }
}

export type RawAuth = Omit<User, 'id'>;
export type Auth = User;
