import type { Seconds } from '../../app';
import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { Result } from '../utils/result';
import { nowUtc } from '../utils/time';
import type { Auth } from './user';
import { UUID } from './uuid';

export interface ISettingsConfig<T> {
    type: 'string' | 'boolean' | 'number';
    name: string;
    description: string;
    defaultValue: T;
    unit?: string;
}

export type SettingsKey = keyof typeof Settings.config;
export type SettingsConfig = {
    [key in SettingsKey]: Settings<
        (typeof Settings.config)[key]['defaultValue']
    >;
} & {
    [key: string]: Settings<string | number | boolean>;
};

export class Settings<T = unknown> {
    public static config = {
        darkMode: {
            type: 'boolean',
            defaultValue: false as boolean,
            name: 'Dark Mode',
            description: 'Use a darker theme.'
        } satisfies ISettingsConfig<boolean>,
        hideEntriesByDefault: {
            type: 'boolean',
            defaultValue: false as boolean,
            name: 'Blur Entries By Default',
            description: 'Blur entries by default, and manually show them.'
        } satisfies ISettingsConfig<boolean>,
        showAgentWidgetOnEntries: {
            type: 'boolean',
            defaultValue: false as boolean,
            name: 'Show Device',
            description:
                'Shows the operating system of the device the entry was submitted on.'
        } satisfies ISettingsConfig<boolean>,
        autoHideEntriesDelay: {
            type: 'number',
            defaultValue: 0 as number,
            name: 'Auto Blur Entries After',
            description:
                `Blur entries after 'N' seconds without user interaction. ` +
                `Set to 0 to disable.`,
            unit: 'seconds'
        } satisfies ISettingsConfig<Seconds>,
        passcode: {
            type: 'string',
            defaultValue: '' as string,
            name: 'Passcode',
            description: `Passcode to access the app. Leave blank to disable.`
        } satisfies ISettingsConfig<string>,
        passcodeTimeout: {
            type: 'number',
            defaultValue: 0 as number,
            name: 'Passcode Timeout',
            description:
                `Delay before passcode is required again. ` +
                `Set to 0 to only require once per device.`,
            unit: 'seconds'
        } satisfies ISettingsConfig<Seconds>,
        yearOfBirth: {
            type: 'number',
            defaultValue: 2000 as number,
            name: 'Year of Birth',
            description: `The first year in which you lived. Used by the timeline.`
        } satisfies ISettingsConfig<number>
    } satisfies Record<string, ISettingsConfig<unknown>>;

    constructor(
        public readonly id: string,
        public readonly created: number,
        public readonly key: string,
        public readonly value: T
    ) {}

    public static async update(
        query: QueryFunc,
        auth: Auth,
        key: string,
        value: unknown
    ): Promise<Result<Settings>> {
        if (!(key in Settings.config)) {
            return Result.err(`Invalid setting key`);
        }

        const now = nowUtc();

        const expectedType = Settings.config[key as SettingsKey].type;
        if (typeof value !== expectedType) {
            return Result.err(
                `Invalid setting value, expected ${expectedType} but got ${typeof value}`
            );
        }

        const { err, val: valEncrypted } = encrypt(
            JSON.stringify(value),
            auth.key
        );
        if (err) return Result.err(err);

        const alreadyInDb = await query<{ id: string }[]>`
            SELECT id from settings
            WHERE user = ${auth.id}
                AND \`key\` = ${key}
        `;

        if (alreadyInDb.length > 0) {
            const id = alreadyInDb[0].id;
            await query`
                UPDATE settings
                SET 
                    value = ${valEncrypted},
                    created = ${now}
                WHERE id = ${id}
            `;
            return Result.ok(new Settings(id, now, key, value));
        }

        const id = await UUID.generateUUId(query);

        await query`
            INSERT INTO settings (id, user, created, \`key\`, value)
            VALUES (${id}, ${auth.id}, ${now}, ${key}, ${valEncrypted})
        `;

        return Result.ok(new Settings(id, now, key, value));
    }

    public static async all(
        query: QueryFunc,
        auth: Auth
    ): Promise<Result<Settings[]>> {
        const settings = await query<
            {
                id: string;
                created: number;
                key: string;
                value: string;
            }[]
        >`
            SELECT created, id, \`key\`, value
            FROM settings
            WHERE user = ${auth.id}
        `;

        return Result.collect(
            settings.map(setting => {
                const { err, val: unencryptedVal } = decrypt(
                    setting.value,
                    auth.key
                );
                if (err) return Result.err(err);
                return Result.ok(
                    new Settings(
                        setting.id,
                        setting.created,
                        setting.key,
                        JSON.parse(unencryptedVal)
                    )
                );
            })
        );
    }

    public static async allAsMap(
        query: QueryFunc,
        auth: Auth
    ): Promise<Result<Partial<SettingsConfig>>> {
        const res = await Settings.all(query, auth);
        if (res.err) {
            return Result.err(res.err);
        }
        return Result.ok(
            Object.fromEntries(
                res.val.map(s => [s.key, s])
            ) as Partial<SettingsConfig>
        );
    }

    public static fillWithDefaults(
        map: Record<string, Settings>
    ): SettingsConfig {
        const newMap = { ...map };
        for (const [key, config] of Object.entries(Settings.config)) {
            if (!newMap[key]) {
                newMap[key] = new Settings('', 0, key, config.defaultValue);
            }
        }
        return newMap as SettingsConfig;
    }

    public static async purgeAll(
        query: QueryFunc,
        auth: Auth
    ): Promise<Result> {
        await query`
            DELETE
            FROM settings
            WHERE user = ${auth.id}
        `;
        return Result.ok(null);
    }

    public static async changeKey(
        query: QueryFunc,
        auth: Auth,
        newKey: string
    ): Promise<Result> {
        const { val: unencryptedSettings, err } = await Settings.all(
            query,
            auth
        );
        if (err) return Result.err(err);
        for (const setting of unencryptedSettings) {
            const { err, val: newValue } = encrypt(
                JSON.stringify(setting.value),
                newKey
            );
            if (err) return Result.err(err);

            await query`
                UPDATE settings
                SET value = ${newValue}
                WHERE id = ${setting.id}
            `;
        }
        return Result.ok(null);
    }
}
