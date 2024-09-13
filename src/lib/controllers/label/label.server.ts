import { LIMITS } from '$lib/constants';
import { query } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { FileLogger } from '$lib/utils/log.server';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import type { PickOptional } from '../../../types';
import type { Auth } from '../auth/auth.server';
import type { Label as _Label, LabelWithCount } from './label';
import { UId } from '$lib/controllers/uuid/uuid.server';

const labelLogger = new FileLogger('Label');

namespace LabelServer {
    type Label = _Label;

    export async function fromId(auth: Auth, id: string): Promise<Result<Label>> {
        const res = await query<{ id: string; color: string; name: string; created: number }[]>`
            SELECT id, color, name, created
            FROM labels
            WHERE id = ${id}
              AND userId = ${auth.id}
        `;

        if (res.length !== 1) {
            return Result.err('Label not found');
        }

        const nameDecrypted = decrypt(res[0].name, auth.key);
        if (!nameDecrypted.ok) return nameDecrypted.cast();

        return Result.ok({
            id: res[0].id,
            color: res[0].color,
            name: nameDecrypted.val,
            created: res[0].created
        });
    }

    export async function fromName(auth: Auth, nameDecrypted: string): Promise<Result<Label>> {
        const encryptedName = encrypt(nameDecrypted, auth.key);

        const res = await query<{ id: string; color: string; name: string; created: number }[]>`
            SELECT id, color, name, created
            FROM labels
            WHERE name = ${encryptedName}
              AND userId = ${auth.id}
        `;
        if (res.length !== 1) {
            if (res.length !== 0) {
                void labelLogger.error(`Got ${res.length} rows for label name`, {
                    nameDecrypted,
                    res,
                    userId: auth.id
                });
            }
            return Result.err('Label not found');
        }

        return Result.ok({
            id: res[0].id,
            color: res[0].color,
            name: nameDecrypted,
            created: res[0].created
        });
    }

    export async function all(auth: Auth): Promise<Result<Label[]>> {
        const res = await query<{ id: string; color: string; name: string; created: number }[]>`
            SELECT id, color, name, created
            FROM labels
            WHERE userId = ${auth.id}
        `;

        return Result.collect(
            res.map(label => {
                const nameDecrypted = decrypt(label.name, auth.key);
                if (!nameDecrypted.ok) return nameDecrypted.cast();
                return Result.ok({
                    id: label.id,
                    color: label.color,
                    name: nameDecrypted.val,
                    created: label.created
                });
            })
        );
    }

    export async function allIndexedById(auth: Auth): Promise<Result<Record<string, Label>>> {
        return (await Label.all(auth)).map(labels =>
            labels.reduce(
                (prev, label) => {
                    prev[label.id] = label;
                    return prev;
                },
                {} as Record<string, Label>
            )
        );
    }

    export async function userHasLabelWithId(auth: Auth, id: string): Promise<boolean> {
        return (await fromId(auth, id)).ok;
    }

    export async function userHasLabelWithName(
        auth: Auth,
        nameDecrypted: string
    ): Promise<boolean> {
        return (await fromName(auth, nameDecrypted)).ok;
    }

    export async function purgeWithId(auth: Auth, id: string): Promise<void> {
        await query`
            DELETE
            FROM labels
            WHERE id = ${id}
              AND userId = ${auth.id}
        `;
    }

    export async function purgeAll(auth: Auth): Promise<void> {
        await query`
            DELETE
            FROM labels
            WHERE userId = ${auth.id}
        `;
    }

    async function canCreateWithName(auth: Auth, name: string): Promise<string | true> {
        if (await userHasLabelWithName(auth, name)) return 'Label with that name already exists';

        if (name.length > LIMITS.label.nameLenMax)
            return `Name too long (> ${LIMITS.label.nameLenMax} characters)`;

        if (name.length < LIMITS.label.nameLenMin) return `Name too short`;

        const numLabels = await query<{ count: number }[]>`
            SELECT COUNT(*) as count    
            FROM labels
            WHERE userId = ${auth.id}
        `;

        if (numLabels[0].count >= LIMITS.label.maxCount)
            return `Maximum number of labels (${LIMITS.label.maxCount}) reached`;

        return true;
    }

    export async function create(
        auth: Auth,
        json: PickOptional<Label, 'id' | 'created'>
    ): Promise<Result<Label>> {
        const canCreate = await canCreateWithName(auth, json.name);
        if (canCreate !== true) return Result.err(canCreate);

        const id = await UId.generate();
        const created = json.created ?? nowUtc();

        const encryptedName = encrypt(json.name, auth.key);

        if (encryptedName.length > 256) {
            return Result.err('Name too long');
        }

        await query`
            INSERT INTO labels (id, userId, name, color, created)
            VALUES (${id},
                    ${auth.id},
                    ${encryptedName},
                    ${json.color},
                    ${created})
        `;

        return Result.ok({
            id,
            color: json.color,
            name: json.name,
            created
        });
    }

    export async function updateName(
        auth: Auth,
        label: Label,
        name: string
    ): Promise<Result<Label>> {
        if (await userHasLabelWithName(auth, name)) {
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

    export async function updateColor(label: Label, color: string): Promise<Result<Label>> {
        await query`
            UPDATE labels
            SET color = ${color}
            WHERE id = ${label.id}
        `;

        label.color = color;

        return Result.ok(label);
    }

    export async function withCount(auth: Auth, id: string): Promise<Result<LabelWithCount>> {
        const label = await fromId(auth, id);
        if (!label.ok) return label.cast();

        const entryCount = (
            await query<{ count: number }[]>`
                SELECT count(*) as count
                FROM entries
                WHERE userId = ${auth.id}
                AND labelId = ${id}
            `
        )[0].count;
        const eventCount = (
            await query<{ count: number }[]>`
                SELECT count(*) as count
                FROM events
                WHERE userId = ${auth.id}
                AND labelId = ${id}
            `
        )[0].count;
        const editCount = (
            await query<{ count: number }[]>`
                SELECT count(*) as count
                FROM entryEdits
                WHERE userId = ${auth.id}
                AND oldLabelId = ${id}
            `
        )[0].count;

        return Result.ok({
            ...label.val,
            entryCount,
            eventCount,
            editCount
        });
    }

    export async function allWithCounts(
        auth: Auth
    ): Promise<Result<Record<string, LabelWithCount>>> {
        const allEntryLabelIds = (
            await query<{ labelId: string }[]>`
                SELECT labelId
                FROM entries
                WHERE userId = ${auth.id}
            `
        ).map(({ labelId }) => labelId);
        const allEventLabelIds = (
            await query<{ labelId: string }[]>`
                SELECT labelId
                FROM events
                WHERE userId = ${auth.id}
            `
        ).map(({ labelId }) => labelId);
        const allEditLabelIds = (
            await query<{ labelId: string }[]>`
                SELECT oldLabelId as labelId
                FROM entryEdits
                WHERE userId = ${auth.id}
            `
        ).map(({ labelId }) => labelId);

        return (await all(auth))
            .map(labels =>
                labels.map(label => {
                    // TODO: this is O(n^2) and should be optimized
                    const entryCount = allEntryLabelIds.filter(l => l === label.id).length;
                    const eventCount = allEventLabelIds.filter(l => l === label.id).length;
                    const editCount = allEditLabelIds.filter(l => l === label.id).length;
                    return {
                        ...label,
                        entryCount,
                        eventCount,
                        editCount
                    };
                })
            )
            .map(labels =>
                labels.reduce(
                    (prev, label) => {
                        prev[label.id] = label;
                        return prev;
                    },
                    {} as Record<string, LabelWithCount>
                )
            );
    }

    export async function updateEncryptedFields(
        userId: string,
        oldDecrypt: (a: string) => Result<string>,
        newEncrypt: (a: string) => string
    ): Promise<Result<null[], string>> {
        const labels = await query<
            {
                id: string;
                name: string;
            }[]
        >`
            SELECT id, name
            FROM labels
            WHERE userId = ${userId}
        `;

        return await Result.collectAsync(
            labels.map(async (label): Promise<Result<null>> => {
                const nameRes = oldDecrypt(label.name);
                if (!nameRes.ok) return nameRes.cast();

                await query`
                    UPDATE labels
                    SET name = ${newEncrypt(nameRes.val)}
                    WHERE id = ${label.id}
                      AND userId = ${userId}
                `;
                return Result.ok(null);
            })
        );
    }
}

export const Label = {
    ...LabelServer
};
export type Label = _Label;
