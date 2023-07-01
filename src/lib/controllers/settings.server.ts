import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { Result } from '../utils/result';
import { nowUtc } from '../utils/time';
import type { Auth } from './user';
import { UUId } from './uuid';
import { settingsConfig, type SettingsKey } from '$lib/controllers/settings.client';
import { errorLogger } from '$lib/utils/log';
import type { Settings as _Settings, SettingsConfig } from './settings';
export type Settings = _Settings;

namespace SettingsUtils {
    export async function update(
        query: QueryFunc,
        auth: Auth,
        key: string,
        value: unknown
    ): Promise<Result<Settings>> {
        if (!(key in settingsConfig)) {
            return Result.err(`Invalid setting key`);
        }

        const now = nowUtc();

        const expectedType = settingsConfig[key as SettingsKey].type;
        if (typeof value !== expectedType) {
            return Result.err(
                `Invalid setting value, expected ${expectedType} but got ${typeof value}`
            );
        }

        const { err, val: valEncrypted } = encrypt(JSON.stringify(value), auth.key);
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
            return Result.ok({ id, created: now, key, value });
        }

        const id = await UUId.generateUUId(query);

        await query`
            INSERT INTO settings (id, user, created, \`key\`, value)
            VALUES (${id}, ${auth.id}, ${now}, ${key}, ${valEncrypted})
        `;

        return Result.ok({ id, created: now, key, value });
    }

    /**
     * This should very rarely be called,
     * only as an error correction measure
     */
    export async function clearDuplicateKeys(
        query: QueryFunc,
        auth: Auth,
        duplicated: Set<string>
    ): Promise<void> {
        errorLogger.error('Clearing duplicate settings keys: ', [...duplicated]);
        for (const key of duplicated) {
            await query`
                DELETE FROM settings
                WHERE user = ${auth.id}
                    AND \`key\` = ${key}
                ORDER BY created
                LIMIT 1
            `;
        }
    }

    export async function all(query: QueryFunc, auth: Auth): Promise<Result<Settings[]>> {
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
            await clearDuplicateKeys(query, auth, duplicateKeys);
        }

        return Result.collect(
            settings.map(setting => {
                const { err, val: unencryptedVal } = decrypt(setting.value, auth.key);
                if (err) return Result.err(err);
                return Result.ok({
                    id: setting.id,
                    created: setting.created,
                    key: setting.key,
                    value: JSON.parse(unencryptedVal)
                });
            })
        );
    }

    export async function getValue<T extends keyof typeof settingsConfig>(
        query: QueryFunc,
        auth: Auth,
        key: T
    ): Promise<Result<(typeof settingsConfig)[T]['defaultValue']>> {
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
                AND \`key\` = ${key}
        `;

        if (settings.length < 1) {
            return Result.ok(settingsConfig[key].defaultValue);
        }
        const { err, val } = decrypt(settings[0].value, auth.key);
        if (err) return Result.err(err);
        return Result.ok(JSON.parse(val) as (typeof settingsConfig)[T]['defaultValue']);
    }

    export async function allAsMap(
        query: QueryFunc,
        auth: Auth
    ): Promise<Result<Partial<SettingsConfig>>> {
        const res = await all(query, auth);
        if (res.err) {
            return Result.err(res.err);
        }
        return Result.ok(
            Object.fromEntries(res.val.map(s => [s.key, s])) as Partial<SettingsConfig>
        );
    }

    export async function purgeAll(query: QueryFunc, auth: Auth): Promise<Result> {
        await query`
            DELETE
            FROM settings
            WHERE user = ${auth.id}
        `;
        return Result.ok(null);
    }

    export async function changeEncryptionKeyInDB(
        query: QueryFunc,
        auth: Auth,
        newKey: string
    ): Promise<Result> {
        const { val: unencryptedSettings, err } = await all(query, auth);
        if (err) return Result.err(err);
        for (const setting of unencryptedSettings) {
            const { err, val: newValue } = encrypt(JSON.stringify(setting.value), newKey);
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

export const Settings = SettingsUtils;
