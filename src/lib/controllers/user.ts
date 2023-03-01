import { query } from '../db/mysql';
import { generateUUId } from '../security/uuid';
import { cryptoRandomStr, nowS, Result } from '../utils';

export class User {
    public constructor (
        public id: string,
        public username: string,
        public key: string,
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

    public static async userExistsWithUsername (username: string): Promise<boolean> {
        const res = await query`
            SELECT 1
            FROM users
            WHERE username = ${username}
        `;
        return res.length === 1;
    }

    public static async newUserIsValid (username: string, password: string): Promise<Result> {
        if (username.length < 3) {
            return Result.err('Username must be at least 3 characters');
        }
        if (password.length < 8) {
            return Result.err('Password must be at least 8 characters');
        }

        if (await User.userExistsWithUsername(username)) {
            return Result.err('Username already exists');
        }

        return Result.ok(null);
    }

    public static async create (username: string, password: string): Promise<Result<User>> {
        const { err } = await User.newUserIsValid(username, password);
        if (err) return Result.err(err);

        const salt = await User.generateSalt();
        const id = await generateUUId();

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

    private static async generateSalt (): Promise<string> {
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