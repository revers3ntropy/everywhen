import { Result } from '../utils';
import { query } from '../db/mysql';

export class User {
    public constructor (
        public id: string,
        public username: string,
        public key: string
    ) {
    }

    public static async authenticate (username: string, key: string): Promise<Result<User>> {
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
}

export type RawAuth = Omit<User, 'id'>;