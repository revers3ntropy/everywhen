import { query } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import {
    Settings as _Settings,
    type SettingConfig,
    type SettingsConfig,
    type SettingsKey
} from './settings';
import { UId } from '$lib/controllers/uuid/uuid.server';
import type { Auth } from '$lib/controllers/auth/auth';
import { SSLogger } from '$lib/controllers/logs/logs.server';

const logger = new SSLogger('Settings');

namespace SettingsServer {
    const Settings = _Settings;
    type Settings = _Settings;

    export function validateSetting(
        expectedType: SettingConfig<string>['type'],
        value: unknown
    ): null | string {
        if (typeof expectedType === 'string' && typeof value !== expectedType) {
            return `Invalid setting value, expected ${expectedType} but got ${typeof value}`;
        }
        // enum type
        else if (
            typeof expectedType !== 'string' &&
            (typeof value !== 'string' || !expectedType.includes(value))
        ) {
            return `Invalid setting value, expected one of [${expectedType.join(', ')}]`;
        }
        return null;
    }

    export async function update(
        auth: Auth,
        key: SettingsKey,
        value: unknown
    ): Promise<Result<Settings>> {
        if (!(key in Settings.config)) {
            return Result.err(`Invalid setting key`);
        }

        const now = nowUtc();

        const validationErr = validateSetting(Settings.config[key].type, value);
        if (validationErr !== null) {
            return Result.err(validationErr);
        }

        const valEncrypted = encrypt(JSON.stringify(value), auth.key);

        const alreadyInDb = await query<{ id: string }[]>`
            SELECT id from settings
            WHERE userId = ${auth.id}
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
            return Result.ok({ id, created: now, key, value });
        }

        const id = await UId.generate();

        await query`
            INSERT INTO settings (id, userId, created, \`key\`, value)
            VALUES (${id}, ${auth.id}, ${now}, ${key}, ${valEncrypted})
        `;

        return Result.ok({ id, created: now, key, value });
    }

    /**
     * This should very rarely be called,
     * only as an error correction measure
     */
    export async function clearDuplicateKeys(auth: Auth, duplicated: Set<string>): Promise<void> {
        void logger.error('Clearing duplicate settings keys: ', { duplicated });
        for (const key of duplicated) {
            await query`
                DELETE FROM settings
                WHERE userId = ${auth.id}
                    AND \`key\` = ${key}
                ORDER BY created
                LIMIT 1
            `;
        }
    }

    export async function all(auth: Auth): Promise<Result<Settings[]>> {
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
            WHERE userId = ${auth.id}
        `;

        // check for duplicates
        const seenKeys = new Set<string>();
        const duplicateKeys = new Set<string>();
        settings.forEach(setting => {
            if (seenKeys.has(setting.key)) {
                duplicateKeys.add(setting.key);
            }
            seenKeys.add(setting.key);
        });
        if (duplicateKeys.size > 0) {
            void logger.error('Duplicate settings keys found', { duplicateKeys });
            await clearDuplicateKeys(auth, duplicateKeys);
        }

        return Result.collect(
            settings.map(setting => {
                const decryptRes = decrypt(setting.value, auth.key);
                if (!decryptRes.ok) return decryptRes.cast();
                return Result.ok({
                    id: setting.id,
                    created: setting.created,
                    key: setting.key,
                    value: JSON.parse(decryptRes.val)
                });
            })
        );
    }

    export async function getValue<T extends keyof typeof Settings.config>(
        auth: Auth,
        key: T
    ): Promise<Result<(typeof Settings.config)[T]['defaultValue']>> {
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
            WHERE userId = ${auth.id}
                AND \`key\` = ${key}
        `;

        if (settings.length < 1) {
            return Result.ok(Settings.config[key].defaultValue);
        }
        const valueRes = decrypt(settings[0].value, auth.key);
        if (!valueRes.ok) return valueRes.cast();
        return Result.ok(JSON.parse(valueRes.val) as (typeof Settings.config)[T]['defaultValue']);
    }

    export async function allAsMapWithDefaults(auth: Auth): Promise<Result<SettingsConfig>> {
        const res = await all(auth);
        if (!res.ok) return res.cast();
        return Result.ok(
            Settings.fillWithDefaults(
                Object.fromEntries(res.val.map(s => [s.key, s])) as Partial<SettingsConfig>
            )
        );
    }

    export async function purgeAll(auth: Auth): Promise<Result<null>> {
        await query`
            DELETE
            FROM settings
            WHERE userId = ${auth.id}
        `;
        return Result.ok(null);
    }

    /**
     * @param {string} userId - The ID of the user
     * @param {(a: string) => Result<string>} oldDecrypt - The decryption function for the old encryption
     * @param {(a: string) => string} newEncrypt - The encryption function for the new encryption
     * @returns {Promise<string[]>} - A promise that resolves with an array of errors
     */
    export async function updateEncryptedFields(
        userId: string,
        oldDecrypt: (a: string) => Result<string>,
        newEncrypt: (a: string) => string
    ): Promise<Result<null[], string>> {
        const settings = await query<
            {
                id: string;
                value: string;
            }[]
        >`
            SELECT id, value
            FROM settings
            WHERE userId = ${userId}
        `;

        return await Result.collectAsync(
            settings.map(async (setting): Promise<Result<null>> => {
                const decryptRes = oldDecrypt(setting.value);
                if (!decryptRes.ok) return decryptRes.cast();
                await query`
                        UPDATE settings
                        SET value = ${newEncrypt(decryptRes.val)}
                        WHERE id = ${setting.id}
                          AND userId = ${userId}
                    `;
                return Result.ok(null);
            })
        );
    }
}

export const Settings = {
    ..._Settings,
    ...SettingsServer
};

export type Settings = _Settings;
export type { SettingValue, SettingConfig, SettingsKey, SettingsConfig } from './settings';
