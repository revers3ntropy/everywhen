import { query } from "../db/mysql";
import { Result } from "../utils";

export class Label {
    public constructor (
        public id: string,
        public colour: string,
        public name: string,
        public created: number,
    ) {}

    public static async fromId (id: string): Promise<Result<Label>> {
        const res = await query<Required<Label>[]>`
            SELECT id, colour, name, created
            FROM labels
            WHERE id = ${id}
        `;

        if (res.length === 0) {
            return Result.err("Label not found");
        }

        return Result.ok(new Label(
            res[0].id,
            res[0].colour,
            res[0].name,
            res[0].created
        ));
    }
}