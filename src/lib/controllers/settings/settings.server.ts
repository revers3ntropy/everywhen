import { query } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import { errorLogger } from '$lib/utils/log.server';
import { Settings as _Settings, type SettingsConfig, type SettingsKey } from './settings';
import { UId } from '$lib/controllers/uuid/uuid.server';
import type { Auth } from '$lib/controllers/auth/auth';

namespace SettingsServer {
    const Settings = _Settings;
    type Settings = _Settings;

    export async function update(
        auth: Auth,
        key: SettingsKey,
        value: unknown
    ): Promise<Result<Settings>> {
        if (!(key in Settings.config)) {
            return Result.err(`Invalid setting key`);
        }

        const now = nowUtc();

        const expectedType = Settings.config[key].type;
        if (typeof value !== expectedType) {
            return Result.err(
                `Invalid setting value, expected ${expectedType} but got ${typeof value}`
            );
        }

        const valEncrypted = encrypt(JSON.stringify(value), auth.key);

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

        const id = await UId.Server.generate();

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
    export async function clearDuplicateKeys(auth: Auth, duplicated: Set<string>): Promise<void> {
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
            await clearDuplicateKeys(auth, duplicateKeys);
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
            WHERE user = ${auth.id}
                AND \`key\` = ${key}
        `;

        if (settings.length < 1) {
            return Result.ok(Settings.config[key].defaultValue);
        }
        const { err, val } = decrypt(settings[0].value, auth.key);
        if (err) return Result.err(err);
        return Result.ok(JSON.parse(val) as (typeof Settings.config)[T]['defaultValue']);
    }

    export async function allAsMap(auth: Auth): Promise<Result<Partial<SettingsConfig>>> {
        const res = await all(auth);
        if (res.err) {
            return Result.err(res.err);
        }
        return Result.ok(
            Object.fromEntries(res.val.map(s => [s.key, s])) as Partial<SettingsConfig>
        );
    }

    export async function allAsMapWithDefaults(auth: Auth): Promise<Result<SettingsConfig>> {
        const res = await all(auth);
        if (res.err) {
            return Result.err(res.err);
        }
        const settings = Object.fromEntries(
            res.val.map(s => [s.key, s])
        ) as Partial<SettingsConfig>;
        return Result.ok(Settings.fillWithDefaults(settings));
    }

    export async function purgeAll(auth: Auth): Promise<Result<null>> {
        await query`
            DELETE
            FROM settings
            WHERE user = ${auth.id}
        `;
        return Result.ok(null);
    }

    export async function changeEncryptionKeyInDB(
        auth: Auth,
        newKey: string
    ): Promise<Result<null>> {
        const { val: unencryptedSettings, err } = await all(auth);
        if (err) return Result.err(err);
        for (const setting of unencryptedSettings) {
            const newValue = encrypt(JSON.stringify(setting.value), newKey);

            await query`
                UPDATE settings
                SET value = ${newValue}
                WHERE id = ${setting.id}
            `;
        }
        return Result.ok(null);
    }
}

export const Settings = {
    ..._Settings,
    Server: SettingsServer
};

export type Settings = _Settings;
export type { SettingValue, SettingConfig, SettingsKey, SettingsConfig } from './settings';
