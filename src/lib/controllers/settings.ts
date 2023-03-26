import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { Result } from '../utils/result';
import { nowS } from '../utils/time';
import type { Seconds } from '../utils/types';
import type { Auth } from './user';
import { UUID } from './uuid';

export interface ISettingsConfig<T> {
    type: 'string' | 'boolean' | 'number',
    name: string,
    description: string,
    defaultValue: T,
}

export type SettingsKey = keyof typeof Settings.config;
export type SettingsConfig =
    {
        [key in SettingsKey]:
        Settings<typeof Settings.config[key]['defaultValue']>
    }
    & Record<string, Settings>;

export class Settings<T = unknown> {

    public static config = {
        hideEntriesByDefault: {
            type: 'boolean',
            defaultValue: true,
            name: 'Blur Entries By Default',
            description: 'Blur entries by default, and manually show them.',
        } satisfies ISettingsConfig<boolean>,
        autoHideEntriesDelay: {
            type: 'number',
            defaultValue: 60 * 2,
            name: 'Auto Blur Entries After',
            description: `Blur entries after 'N' seconds without user interaction. ` +
                `Set to 0 to disable.`,
        } satisfies ISettingsConfig<Seconds>,
        entriesPerPage: {
            type: 'number',
            defaultValue: 100,
            name: 'Entries per Page',
            description: `Number of entries displayed per page.`,
        } satisfies ISettingsConfig<Seconds>,
        passcode: {
            type: 'string',
            defaultValue: '',
            name: 'Passcode',
            description: `Passcode to access the app. Set to 0 to disable.`,
        } satisfies ISettingsConfig<string>,
        passcodeTimeout: {
            type: 'number',
            defaultValue: 0,
            name: 'Passcode Timeout',
            description: `Delay before passcode is required again. `
                + `Set to 0 to only require once.`,
        } satisfies ISettingsConfig<Seconds>,
    } satisfies Record<string, ISettingsConfig<unknown>>;

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
        key: string,
        value: unknown,
    ): Promise<Result<Settings>> {
        const id = await UUID.generateUUId(query);

        if (!Settings.config.hasOwnProperty(key)) {
            return Result.err(`Invalid setting key`);
        }

        const now = nowS();

        const expectedType = Settings.config[key as SettingsKey].type;
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
    ): Promise<Result<Partial<SettingsConfig>>> {
        const res = await Settings.all(query, auth);
        if (res.err) {
            return Result.err(res.err);
        }
        return Result.ok(Object.fromEntries(
            res.val.map(s => [ s.key, s ]),
        ) as Partial<SettingsConfig>);
    }

    public static fillWithDefaults (
        map: Record<string, Settings>,
    ): SettingsConfig {
        const newMap = { ...map };
        for (const [ key, config ] of Object.entries(Settings.config)) {
            if (!newMap[key]) {
                newMap[key] = new Settings(
                    '', 0,
                    key, config.defaultValue,
                );
            }
        }
        return newMap as SettingsConfig;
    }
}