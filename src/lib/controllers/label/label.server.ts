import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { UsageLimits } from '$lib/controllers/usageLimits/usageLimits.server';
import { query } from '$lib/db/mysql.server';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import type { PickOptional } from '../../../types';
import type { Auth } from '../auth/auth.server';
import type { Label as _Label, LabelWithCount } from './label';
import { UId } from '$lib/controllers/uuid/uuid.server';
import { SSLogger } from '$lib/controllers/logs/logs.server';

const labelLogger = new SSLogger('Label');

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

        return Result.ok(res[0]);
    }

    export async function fromName(auth: Auth, name: string): Promise<Result<Label>> {
        const res = await query<{ id: string; color: string; name: string; created: number }[]>`
            SELECT id, color, name, created
            FROM labels
            WHERE name = ${name}
              AND userId = ${auth.id}
        `;
        if (res.length !== 1) {
            if (res.length !== 0) {
                void labelLogger.error(`Got ${res.length} rows for label name`, {
                    name,
                    res,
                    userId: auth.id
                });
            }
            return Result.err('Label not found');
        }

        return Result.ok(res[0]);
    }

    export async function all(auth: Auth): Promise<Label[]> {
        return await query<
            {
                id: string;
                color: string;
                name: string;
                created: number;
            }[]
        >`
            SELECT id, color, name, created
            FROM labels
            WHERE userId = ${auth.id}
        `;
    }

    export async function allIndexedById(auth: Auth): Promise<Record<string, Label>> {
        return (await Label.all(auth)).reduce(
            (prev, label) => {
                prev[label.id] = label;
                return prev;
            },
            {} as Record<string, Label>
        );
    }

    export async function userHasLabelWithId(auth: Auth, id: string): Promise<boolean> {
        return (await fromId(auth, id)).ok;
    }

    export async function userHasLabelWithName(
        auth: Auth,
        nameEncrypted: string
    ): Promise<boolean> {
        return (await fromName(auth, nameEncrypted)).ok;
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
        if (name.length > UsageLimits.LIMITS.label.nameLenMax)
            return `Name too long (> ${UsageLimits.LIMITS.label.nameLenMax} characters)`;

        if (name.length < UsageLimits.LIMITS.label.nameLenMin) return `Name too short`;

        if (await userHasLabelWithName(auth, name)) return 'Label with that name already exists';

        const [count, max] = await UsageLimits.labelUsage(
            auth,
            await Subscription.getCurrentSubscription(auth)
        );
        if (count >= max) return `Maximum number of labels reached`;

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

        if (json.name.length > UsageLimits.LIMITS.label.nameLenMax)
            return Result.err('Label name too long');
        if (json.name.length < UsageLimits.LIMITS.label.nameLenMin)
            return Result.err('Label name too short');

        const [count, max] = await UsageLimits.labelUsage(
            auth,
            await Subscription.getCurrentSubscription(auth)
        );
        if (count >= max) return Result.err(`Maximum number of labels (${max}) reached`);

        await query`
            INSERT INTO labels (id, userId, name, color, created)
            VALUES (${id}, ${auth.id}, ${json.name}, ${json.color}, ${created})
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

        if (name.length > UsageLimits.LIMITS.label.nameLenMax)
            return Result.err('Label name too long');
        if (name.length < UsageLimits.LIMITS.label.nameLenMin)
            return Result.err('Label name too short');

        await query`
            UPDATE labels
            SET name = ${name}
            WHERE id = ${label.id}
        `;

        label.name = name;

        return Result.ok(label);
    }

    export async function updateColor(label: Label, color: string): Promise<void> {
        await query`
            UPDATE labels
            SET color = ${color}
            WHERE id = ${label.id}
        `;
    }

    export async function fromIdWithUsageCounts(
        auth: Auth,
        id: string
    ): Promise<Result<LabelWithCount>> {
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

    export async function allWithCounts(auth: Auth): Promise<Record<string, LabelWithCount>> {
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
            .map(label => {
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
            .reduce(
                (prev, label) => {
                    prev[label.id] = label;
                    return prev;
                },
                {} as Record<string, LabelWithCount>
            );
    }
}

export const Label = {
    ...LabelServer
};
export type Label = _Label;
