import { apiPath } from '$lib/utils/apiRequest';
import type { Api } from '$lib/utils/apiRequest';
import type { PickOptional } from '../../app';
import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { Result } from '../utils/result';
import { nowUtc } from '../utils/time';
import type { Auth } from './user';
import { UUID } from './uuid';

export type LabelWithCount = Label & {
    entryCount: number;
    eventCount: number;
};

export class Label {
    private constructor(
        public id: string,
        public color: string,
        public name: string,
        public created: number
    ) {}

    public static async fromId(
        query: QueryFunc,
        auth: Auth,
        id: string
    ): Promise<Result<Label>> {
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

        return Result.ok(
            new Label(res[0].id, res[0].color, nameDecrypted, res[0].created)
        );
    }

    public static async getIdFromName(
        query: QueryFunc,
        auth: Auth,
        nameDecrypted: string
    ): Promise<Result<string>> {
        const { err, val: encryptedName } = encrypt(nameDecrypted, auth.key);
        if (err) return Result.err(err);

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

    public static async fromName(
        query: QueryFunc,
        auth: Auth,
        nameDecrypted: string
    ): Promise<Result<Label>> {
        const { err, val: encryptedName } = encrypt(nameDecrypted, auth.key);
        if (err) return Result.err(err);

        const res = await query<Required<Label>[]>`
            SELECT id, color, name, created
            FROM labels
            WHERE name = ${encryptedName}
              AND user = ${auth.id}
        `;

        if (res.length !== 1) {
            return Result.err('Label not found');
        }

        return Result.ok(
            new Label(res[0].id, res[0].color, nameDecrypted, res[0].created)
        );
    }

    public static async all(
        query: QueryFunc,
        auth: Auth
    ): Promise<Result<Label[]>> {
        const res = await query<Required<Label>[]>`
            SELECT id, color, name, created
            FROM labels
            WHERE user = ${auth.id}
            ORDER BY name
        `;

        return Result.collect(
            res.map(label => {
                const { err, val: nameDecrypted } = decrypt(
                    label.name,
                    auth.key
                );
                if (err) return Result.err(err);
                return Result.ok(
                    new Label(
                        label.id,
                        label.color,
                        nameDecrypted,
                        label.created
                    )
                );
            })
        );
    }

    public static async userHasLabelWithId(
        query: QueryFunc,
        auth: Auth,
        id: string
    ): Promise<boolean> {
        return (await Label.fromId(query, auth, id)).isOk;
    }

    public static async userHasLabelWithName(
        query: QueryFunc,
        auth: Auth,
        nameDecrypted: string
    ): Promise<boolean> {
        return (await Label.fromName(query, auth, nameDecrypted)).isOk;
    }

    public static jsonIsRawLabel(label: unknown): label is Omit<Label, 'id'> {
        return (
            typeof label === 'object' &&
            label !== null &&
            'color' in label &&
            typeof label.color === 'string' &&
            'name' in label &&
            typeof label.name === 'string' &&
            'created' in label &&
            typeof label.created === 'number'
        );
    }

    public static async purgeWithId(
        query: QueryFunc,
        auth: Auth,
        id: string
    ): Promise<void> {
        await query`
            DELETE
            FROM labels
            WHERE id = ${id}
              AND user = ${auth.id}
        `;
    }

    public static async purgeAll(query: QueryFunc, auth: Auth): Promise<void> {
        await query`
            DELETE
            FROM labels
            WHERE user = ${auth.id}
        `;
    }

    public static async create(
        query: QueryFunc,
        auth: Auth,
        json: PickOptional<Label, 'id' | 'created'>
    ): Promise<Result<Label>> {
        if (await Label.userHasLabelWithName(query, auth, json.name)) {
            return Result.err('Label with that name already exists');
        }

        json = { ...json };
        json.id ??= await UUID.generateUUId(query);
        json.created ??= nowUtc();

        const { err, val: encryptedName } = encrypt(json.name, auth.key);
        if (err) return Result.err(err);

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

        return Result.ok(
            new Label(json.id, json.color, json.name, json.created)
        );
    }

    public static async updateName(
        query: QueryFunc,
        auth: Auth,
        label: Label,
        name: string
    ): Promise<Result<Label>> {
        if (await Label.userHasLabelWithName(query, auth, name)) {
            return Result.err('Label with that name already exists');
        }

        const { err, val: encryptedName } = encrypt(name, auth.key);
        if (err) return Result.err(err);

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

    public static async updateColor(
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

    public static async allWithCounts(
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

    public static async withIdFromListOrFetch(
        api: Api,
        auth: Auth,
        id: string,
        labels: Label[]
    ): Promise<Result<Label>> {
        for (const label of labels) {
            if (label.id === id) {
                return Result.ok(label);
            }
        }

        return await api.get(auth, apiPath('/labels/?', id));
    }
}
