import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { generateUUId } from '../security/uuid';
import { Result } from '../utils/result';
import { nowS } from '../utils/time';
import type { PickOptional } from '../utils/types';
import type { Auth } from './user';

export class Label {
    private constructor (
        public id: string,
        public colour: string,
        public name: string,
        public created: number,
    ) {
    }

    public static async fromId (
        query: QueryFunc,
        auth: Auth,
        id: string,
    ): Promise<Result<Label>> {
        const res = await query<Required<Label>[]>`
            SELECT id, colour, name, created
            FROM labels
            WHERE id = ${id}
              AND user = ${auth.id}
        `;

        if (res.length !== 1) {
            return Result.err('Label not found');
        }

        return Result.ok(new Label(
            res[0].id,
            res[0].colour,
            decrypt(res[0].name, auth.key),
            res[0].created,
        ));
    }

    public static async getIdFromName (
        query: QueryFunc,
        auth: Auth,
        nameDecrypted: string,
    ): Promise<Result<string>> {
        const res = await query<Required<Label>[]>`
            SELECT id
            FROM labels
            WHERE name = ${encrypt(nameDecrypted, auth.key)}
              AND user = ${auth.id}
        `;

        if (res.length !== 1) {
            return Result.err('No Label with that name');
        }

        return Result.ok(res[0].id);
    }

    public static async fromName (
        query: QueryFunc,
        auth: Auth,
        nameDecrypted: string,
    ): Promise<Result<Label>> {
        const res = await query<Required<Label>[]>`
            SELECT id, colour, name, created
            FROM labels
            WHERE name = ${encrypt(nameDecrypted, auth.key)}
              AND user = ${auth.id}
        `;

        if (res.length !== 1) {
            return Result.err('Label not found');
        }

        return Result.ok(new Label(
            res[0].id,
            res[0].colour,
            nameDecrypted,
            res[0].created,
        ));
    }

    public static async all (
        query: QueryFunc,
        auth: Auth,
    ): Promise<Label[]> {
        const res = await query<Required<Label>[]>`
            SELECT id, colour, name, created
            FROM labels
            WHERE user = ${auth.id}
            ORDER BY name
        `;

        return res.map(label => new Label(
            label.id,
            label.colour,
            decrypt(label.name, auth.key),
            label.created,
        ));
    }

    public static async userHasLabelWithId (
        query: QueryFunc,
        auth: Auth,
        id: string,
    ): Promise<boolean> {
        return (await Label.fromId(query, auth, id)).isOk;
    }

    public static async userHasLabelWithName (
        query: QueryFunc,
        auth: Auth,
        nameDecrypted: string,
    ): Promise<boolean> {
        return (await Label.fromName(query, auth, nameDecrypted)).isOk;
    }

    public static jsonIsRawLabel (
        label: unknown,
    ): label is Omit<Label, 'id'> {
        return typeof label === 'object'
            && label !== null
            && 'colour' in label
            && typeof label.colour === 'string'
            && 'name' in label
            && typeof label.name === 'string'
            && 'created' in label
            && typeof label.created === 'number';
    }

    public static async purgeWithId (
        query: QueryFunc,
        auth: Auth,
        id: string,
    ): Promise<void> {
        await query`
            DELETE
            FROM labels
            WHERE id = ${id}
              AND user = ${auth.id}
        `;
    }

    public static async purgeAll (
        query: QueryFunc,
        auth: Auth,
    ): Promise<void> {
        await query`
            DELETE
            FROM labels
            WHERE user = ${auth.id}
        `;
    }

    public static async create (
        query: QueryFunc,
        auth: Auth,
        json: PickOptional<Label, 'id' | 'created'>,
    ): Promise<Result<Label>> {

        if (await Label.userHasLabelWithName(query, auth, json.name)) {
            return Result.err('Label with that name already exists');
        }

        json = { ...json };
        json.id ??= await generateUUId(query);
        json.created ??= nowS();

        await query`
            INSERT INTO labels (id, user, name, colour, created)
            VALUES (${json.id},
                    ${auth.id},
                    ${encrypt(json.name, auth.key)},
                    ${json.colour},
                    ${json.created})
        `;

        return Result.ok(new Label(
            json.id,
            json.colour,
            json.name,
            json.created,
        ));
    }

    public static async updateName (
        query: QueryFunc,
        auth: Auth,
        label: Label,
        name: string,
    ): Promise<Result<Label>> {
        if (await Label.userHasLabelWithName(query, auth, name)) {
            return Result.err('Label with that name already exists');
        }

        await query`
            UPDATE labels
            SET name = ${encrypt(name, auth.key)}
            WHERE id = ${label.id}
        `;

        label.name = name;

        return Result.ok(label);
    }

    public static async updateColour (
        query: QueryFunc,
        label: Label,
        colour: string,
    ): Promise<Result<Label>> {
        await query`
            UPDATE labels
            SET colour = ${colour}
            WHERE id = ${label.id}
        `;

        label.colour = colour;

        return Result.ok(label);
    }
}