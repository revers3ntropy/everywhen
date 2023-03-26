import type { QueryFunc } from '../db/mysql';
import { Result } from '../utils/result';
import { cryptoRandomStr } from '../utils/text';
import { nowS } from '../utils/time';
import { Asset } from './asset';
import { Entry } from './entry';
import { Event } from './event';
import { Label } from './label';
import { Settings } from './settings';
import { UUID } from './uuid';

export class User {
    public constructor (
        public id: string,
        public username: string,
        public key: string,
    ) {
    }

    public static async authenticate (
        query: QueryFunc,
        username: string,
        key: string,
    ): Promise<Result<User>> {
        const res = await query`
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

    public static async userExistsWithUsername (
        query: QueryFunc,
        username: string,
    ): Promise<boolean> {
        const res = await query`
            SELECT 1
            FROM users
            WHERE username = ${username}
        `;
        return res.length === 1;
    }

    public static async newUserIsValid (
        query: QueryFunc,
        username: string,
        password: string,
    ): Promise<Result> {
        if (username.length < 3) {
            return Result.err('Username must be at least 3 characters');
        }
        if (password.length < 8) {
            return Result.err('Password must be at least 8 characters');
        }

        if (await User.userExistsWithUsername(query, username)) {
            return Result.err('Username already exists');
        }

        return Result.ok(null);
    }

    public static async create (
        query: QueryFunc,
        username: string,
        password: string,
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
                    ${nowS()});
        `;

        return Result.ok(new User(id, username, password));
    }

    public static async purge (query: QueryFunc, auth: Auth): Promise<void> {
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

    private static async generateSalt (query: QueryFunc): Promise<string> {
        let salt = '';
        while (true) {
            salt = cryptoRandomStr(10);
            const existingSalts = await query`
                SELECT salt
                FROM users
                WHERE salt = ${salt}
            `;
            if (existingSalts.length === 0) {
                break;
            }
        }
        return salt;
    }
}

export type RawAuth = Omit<User, 'id'>;
export type Auth = User;