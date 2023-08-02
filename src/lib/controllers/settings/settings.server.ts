import type { QueryFunc } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/security/encryption.server';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import type { Auth } from '../user/user';
import { UUId } from '../uuid/uuid';
import type { SettingsKey } from '$lib/controllers/settings/settings.client';
import { errorLogger } from '$lib/utils/log.server';
import { Settings as _Settings, type SettingsConfig } from './settings';

export type Settings<T = unknown> = _Settings<T>;

namespace SettingsUtils {
    export async function update(
        query: QueryFunc,
        auth: Auth,
        key: SettingsKey,
        value: unknown
    ): Promise<Result<Settings>> {
        if (!(key in _Settings.config)) {
            return Result.err(`Invalid setting key`);
        }

        const now = nowUtc();

        const expectedType = _Settings.config[key ].type;
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

        const id = await UUId.generateUniqueUUId(query);

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
        void errorLogger.error('Clearing duplicate settings keys: ', [...duplicated]);
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

    export async function getValue<T extends keyof typeof _Settings.config>(
        query: QueryFunc,
        auth: Auth,
        key: T
    ): Promise<Result<(typeof _Settings.config)[T]['defaultValue']>> {
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
            return Result.ok(_Settings.config[key].defaultValue);
        }
        const { err, val } = decrypt(settings[0].value, auth.key);
        if (err) return Result.err(err);
        return Result.ok(JSON.parse(val) as (typeof _Settings.config)[T]['defaultValue']);
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

    export async function allAsMapWithDefaults(
        query: QueryFunc,
        auth: Auth
    ): Promise<Result<SettingsConfig>> {
        const res = await all(query, auth);
        if (res.err) {
            return Result.err(res.err);
        }
        const settings = Object.fromEntries(
            res.val.map(s => [s.key, s])
        ) as Partial<SettingsConfig>;
        return Result.ok(_Settings.fillWithDefaults(settings));
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
