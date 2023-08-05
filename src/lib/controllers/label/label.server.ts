import type { QueryFunc } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/utils/encryption/encryption.server';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import type { Auth } from '../auth/auth.server';
import type { Label as _Label, LabelWithCount } from './label';
import { UUIdControllerServer } from '$lib/controllers/uuid/uuid.server';

export type Label = _Label;

namespace LabelUtils {
    export async function fromId(query: QueryFunc, auth: Auth, id: string): Promise<Result<Label>> {
        const res = await query<Required<Label>[]>`
            SELECT id, color, name, created
            FROM labels
            WHERE id = ${id}
              AND user = ${auth.id}
        `;

        if (res.length !== 1) {
            return Result.err('Label not found');
        }

        const { err, val: nameDecrypted } = decrypt(res[0].name, auth.key);
        if (err) return Result.err(err);

        return Result.ok({
            id: res[0].id,
            color: res[0].color,
            name: nameDecrypted,
            created: res[0].created
        });
    }

    export async function getIdFromName(
        query: QueryFunc,
        auth: Auth,
        nameDecrypted: string
    ): Promise<Result<string>> {
        const encryptedName = encrypt(nameDecrypted, auth.key);

        const res = await query<Required<Label>[]>`
            SELECT id
            FROM labels
            WHERE name = ${encryptedName}
              AND user = ${auth.id}
        `;

        if (res.length !== 1) {
            return Result.err('No Label with that name');
        }

        return Result.ok(res[0].id);
    }

    export async function fromName(
        query: QueryFunc,
        auth: Auth,
        nameDecrypted: string
    ): Promise<Result<Label>> {
        const encryptedName = encrypt(nameDecrypted, auth.key);

        const res = await query<Required<Label>[]>`
            SELECT id, color, name, created
            FROM labels
            WHERE name = ${encryptedName}
              AND user = ${auth.id}
        `;

        if (res.length !== 1) {
            return Result.err('Label not found');
        }

        return Result.ok({
            id: res[0].id,
            color: res[0].color,
            name: nameDecrypted,
            created: res[0].created
        });
    }

    export async function all(query: QueryFunc, auth: Auth): Promise<Result<Label[]>> {
        const res = await query<Required<Label>[]>`
            SELECT id, color, name, created
            FROM labels
            WHERE user = ${auth.id}
            ORDER BY name
        `;

        return Result.collect(
            res.map(label => {
                const { err, val: nameDecrypted } = decrypt(label.name, auth.key);
                if (err) return Result.err(err);
                return Result.ok({
                    id: label.id,
                    color: label.color,
                    name: nameDecrypted,
                    created: label.created
                });
            })
        );
    }

    export async function userHasLabelWithId(
        query: QueryFunc,
        auth: Auth,
        id: string
    ): Promise<boolean> {
        return (await Label.fromId(query, auth, id)).isOk;
    }

    export async function userHasLabelWithName(
        query: QueryFunc,
        auth: Auth,
        nameDecrypted: string
    ): Promise<boolean> {
        return (await Label.fromName(query, auth, nameDecrypted)).isOk;
    }

    export async function purgeWithId(query: QueryFunc, auth: Auth, id: string): Promise<void> {
        await query`
            DELETE
            FROM labels
            WHERE id = ${id}
              AND user = ${auth.id}
        `;
    }

    export async function purgeAll(query: QueryFunc, auth: Auth): Promise<void> {
        await query`
            DELETE
            FROM labels
            WHERE user = ${auth.id}
        `;
    }

    export async function create(
        query: QueryFunc,
        auth: Auth,
        json: PickOptional<Label, 'id' | 'created'>
    ): Promise<Result<Label>> {
        if (await Label.userHasLabelWithName(query, auth, json.name)) {
            return Result.err('Label with that name already exists');
        }

        json = { ...json };
        json.id ??= await UUIdControllerServer.generate();
        json.created ??= nowUtc();

        const encryptedName = encrypt(json.name, auth.key);

        if (encryptedName.length > 256) {
            return Result.err('Name too long');
        }

        await query`
            INSERT INTO labels (id, user, name, color, created)
            VALUES (${json.id},
                    ${auth.id},
                    ${encryptedName},
                    ${json.color},
                    ${json.created})
        `;

        return Result.ok({
            id: json.id,
            color: json.color,
            name: json.name,
            created: json.created
        });
    }

    export async function updateName(
        query: QueryFunc,
        auth: Auth,
        label: Label,
        name: string
    ): Promise<Result<Label>> {
        if (await Label.userHasLabelWithName(query, auth, name)) {
            return Result.err('Label with that name already exists');
        }

        const encryptedName = encrypt(name, auth.key);

        if (encryptedName.length > 256) {
            return Result.err('Name too long');
        }

        await query`
            UPDATE labels
            SET name = ${encryptedName}
            WHERE id = ${label.id}
        `;

        label.name = name;

        return Result.ok(label);
    }

    export async function updateColor(
        query: QueryFunc,
        label: Label,
        color: string
    ): Promise<Result<Label>> {
        await query`
            UPDATE labels
            SET color = ${color}
            WHERE id = ${label.id}
        `;

        label.color = color;

        return Result.ok(label);
    }

    export async function allWithCounts(
        query: QueryFunc,
        auth: Auth
    ): Promise<Result<LabelWithCount[]>> {
        const { err, val: all } = await Label.all(query, auth);
        if (err) return Result.err(err);

        return Result.ok(
            await Promise.all(
                all.map(async label => {
                    const entryCount = await query<{ count: number }[]>`
                SELECT COUNT(*) as count
                FROM entries
                WHERE user = ${auth.id}
                  AND label = ${label.id}
            `;
                    const eventCount = await query<{ count: number }[]>`
                SELECT COUNT(*) as count
                FROM events
                WHERE user = ${auth.id}
                  AND label = ${label.id}
            `;
                    const editCount = await query<{ count: number }[]>`
                SELECT COUNT(*) as count
                FROM entryEdits,
                     entries
                WHERE entryEdits.entry = entries.id
                  AND entries.user = ${auth.id}
                  AND entryEdits.label = ${label.id}
            `;

                    return {
                        ...label,
                        entryCount: entryCount[0].count + editCount[0].count,
                        eventCount: eventCount[0].count
                    };
                })
            )
        );
    }
}

export const Label = LabelUtils;
