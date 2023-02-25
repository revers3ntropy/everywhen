import { query } from '../db/mysql';
import { generateUUId } from '../security/uuid';
import { Result, type Writeable } from '../utils';
import { decrypt } from '../security/encryption';
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

    public static async all (auth: User): Promise<Label[]> {
        const res = await query<Required<Label>[]>`
            SELECT id, colour, name, created
            FROM labels
            WHERE user = ${auth.id}
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
              & Partial<Writeable<Pick<Label, 'id'>>>
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
}