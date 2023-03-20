import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { generateUUId } from '../security/uuid';
import { Result } from '../utils/result';
import { nowS } from '../utils/time';
import type { Auth } from './user';

export interface ISettingsConfig<T> {
    type: 'string' | 'boolean' | 'number',
    name: string,
    description: string,
    defaultValue: T,
}

export type SettingsConfig =
    Record<
        keyof typeof Settings.config,
        Settings<typeof Settings.config[keyof typeof Settings.config]['defaultValue']>
    >

export class Settings<T = unknown> {

    public static config = {
        hideEntriesByDefault: {
            type: 'boolean',
            defaultValue: true,
            name: 'Blur Entries By Default',
            description: 'Blur entries by default, and manually show them.',
        } satisfies ISettingsConfig<boolean>,
    };

    constructor (
        public readonly id: string,
        public readonly created: number,
        public readonly key: string,
        public readonly value: T,
    ) {
    }

    public static async update (
        query: QueryFunc,
        auth: Auth,
        key: keyof typeof Settings.config,
        value: unknown,
    ): Promise<Result<Settings>> {
        const id = await generateUUId(query);

        if (!Settings.config[key]) {
            return Result.err(`Invalid setting key`);
        }

        const now = nowS();

        const expectedType = Settings.config[key].type;
        if (typeof value !== expectedType) {
            return Result.err(
                `Invalid setting value, expected ${expectedType} but got ${typeof value}`);
        }

        const { err, val: valEncrypted } = encrypt(JSON.stringify(value), auth.key);
        if (err) return Result.err(err);

        await query`
            INSERT INTO settings (id, user, created, \`key\`, value)
            VALUES (${id}, ${auth.id}, ${now}, ${key}, ${valEncrypted})
        `;

        return Result.ok(new Settings(id, now, key, value));
    }

    public static async all (
        query: QueryFunc,
        auth: Auth,
    ): Promise<Result<Settings[]>> {
        const settings = await query<{
            id: string,
            created: number,
            key: string,
            value: string,
        }[]>`
            SELECT created, id, \`key\`, value
            FROM settings
            WHERE user = ${auth.id}
              AND created = (SELECT max(created)
                             FROM settings as S
                             WHERE user = ${auth.id}
                               AND S.\`key\` = settings.\`key\`)
        `;

        return Result.collect(settings.map((setting) => {
            const { err, val: unencryptedVal } = decrypt(setting.value, auth.key);
            if (err) return Result.err(err);
            return Result.ok(new Settings(
                setting.id,
                setting.created,
                setting.key,
                JSON.parse(unencryptedVal) as any,
            ));
        }));
    }

    public static async allAsMap (
        query: QueryFunc,
        auth: Auth,
    ): Promise<Result<Record<string, Settings>>> {
        const res = await Settings.all(query, auth);
        if (res.err) return Result.err(res.err);
        return Result.ok(Object.fromEntries(
            res.val.map(s => [ s.key, s ]),
        ));
    }

    public static fillWithDefaults (
        map: Record<string, Settings>,
    ): Record<string, Settings> {
        const newMap = { ...map };
        for (const [ key, config ] of Object.entries(Settings.config)) {
            if (!newMap[key]) {
                newMap[key] = new Settings(
                    '', 0,
                    key, config.defaultValue,
                );
            }
        }
        return newMap;
    }
}