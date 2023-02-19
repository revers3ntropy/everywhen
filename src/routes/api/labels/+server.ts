import type { RequestHandler } from "./$types";
import { query } from "../../../lib/db/mysql";
import { generateUUId } from "../../../lib/security/uuid";
import { error } from "@sveltejs/kit";
import { encrypt } from "../../../lib/security/encryption";
import { getAuthFromCookies } from "../../../lib/security/getAuthFromCookies";
import { decryptLabels } from "./utils.server";
import type { Label } from "../../../lib/types";

export const GET: RequestHandler = async ({ cookies }) => {
    const { key, id } = await getAuthFromCookies(cookies);

    const labels = await query<Label[]>`
        SELECT labels.id,
               labels.created,
               labels.name,
               labels.colour
        FROM labels,
             users
        WHERE labels.user = users.id
          AND users.id = ${ id }
        ORDER BY labels.name, labels.colour
    `;

    return new Response(
        JSON.stringify({
            labels: decryptLabels(labels, key)
        }),
        { status: 200 }
    );
};

export const POST: RequestHandler = async ({ request, cookies }) => {
    const { key, id: userId } = await getAuthFromCookies(cookies);

    const body = await request.json();
    const id = await generateUUId();
    const time = Math.round(Date.now() / 1000);

    if (typeof body.name !== "string" || !body.name) {
        throw error(400, "invalid name");
    }
    if (typeof body.colour !== "string" || !body.colour) {
        throw error(400, "invalid colour");
    }

    const name = encrypt(body.name, key);

    // check name doesn't already exist
    const label = await query`
        SELECT id
        FROM labels
        WHERE name = ${ name }
    `;
    if (label.length) {
        throw error(400, "Label with that name already exists");
    }

    await query`
        INSERT INTO labels (id,
                            name,
                            colour,
                            created,
                            user)
        VALUES (${ id },
                ${ name },
                ${ body.colour },
                ${ time },
                ${ userId })
    `;

    return new Response(JSON.stringify({ id }), { status: 201 });
};
