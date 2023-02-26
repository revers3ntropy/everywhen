import { query } from '../db/mysql';
import { generateUUId } from '../security/uuid';
import { Result, type Mutable } from '../utils';
import { decrypt, encrypt } from '../security/encryption';
import type { User } from './user';

export class Label {
    private constructor (
        public id: string,
        public colour: string,
        public name: string,
        public created: number
    ) {
    }

    public static async fromId (auth: User, id: string): Promise<Result<Label>> {
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
            decrypt(auth.key, res[0].name),
            res[0].created
        ));
    }

    public static async fromName (
        auth: User,
        nameDecrypted: string
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
            res[0].created
        ));
    }

    public static async all (auth: User): Promise<Label[]> {
        const res = await query<Required<Label>[]>`
            SELECT id, colour, name, created
            FROM labels
            WHERE user = ${auth.id}
            ORDER BY name
        `;

        return res.map(label => new Label(
            label.id,
            label.colour,
            decrypt(auth.key, label.name),
            label.created
        ));
    }

    public static async userHasLabelWithId (
        auth: User,
        id: string
    ): Promise<boolean> {
        return (await Label.fromId(auth, id)).isOk;
    }

    public static async userHasLabelWithName (
        auth: User,
        nameDecrypted: string
    ): Promise<boolean> {
        return (await Label.fromName(auth, nameDecrypted)).isOk;
    }

    public static jsonIsRawLabel (label: unknown): label is Required<Label> {
        return typeof label === 'object'
            && label !== null
            && 'id' in label
            && typeof label.id === 'string'
            && 'colour' in label
            && typeof label.colour === 'string'
            && 'name' in label
            && typeof label.name === 'string'
            && 'created' in label
            && typeof label.created === 'number';
    }

    public static async purgeWithId (auth: User, id: string): Promise<void> {
        await query`
            DELETE
            FROM labels
            WHERE id = ${id}
              AND user = ${auth.id}
        `;
    }

    public static async create (
        auth: User,
        json: Omit<Label, 'id'>
              & Partial<Mutable<Pick<Label, 'id'>>>
    ): Promise<Result<Label>> {
        if (!json.id) {
            json.id = await generateUUId();
        }

        await query`
            INSERT INTO labels (id, user, name, colour, created)
            VALUES (${json.id}, ${auth.id}, ${json.name},
                    ${json.colour}, ${json.created})
        `;

        return Result.ok(new Label(
            json.id,
            json.colour,
            json.name,
            json.created
        ));
    }

    public async updateName (auth: User, name: string): Promise<Result<Label>> {
        if (await Label.userHasLabelWithName(auth, name)) {
            return Result.err('Label with that name already exists');
        }

        await query`
            UPDATE labels
            SET name = ${encrypt(name, auth.key)}
            WHERE id = ${this.id}
        `;

        this.name = name;

        return Result.ok(this);
    }

    public async updateColour (colour: string): Promise<Result<Label>> {
        await query`
            UPDATE labels
            SET colour = ${colour}
            WHERE id = ${this.id}
        `;

        this.colour = colour;

        return Result.ok(this);
    }
}