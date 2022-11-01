import { getAuthFromCookies } from "$lib/security/getAuthFromCookies";
import { query } from "$lib/db/mysql";
import { decryptLabel } from "../utils.server";
import type { RequestHandler } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import type { Label } from "$lib/types";
import { encrypt } from "../../../../lib/security/encryption";

export const GET: RequestHandler = async ({ cookies, params }) => {
    const { key, id } = await getAuthFromCookies(cookies);

    const labels = await query<Label[]>`
        SELECT 
            labels.id,
            labels.created,
            labels.name,
            labels.colour
        FROM labels, users
        WHERE labels.user = users.id
          AND users.id = ${id}
          AND labels.id LIKE ${params.labelId}
        ORDER BY name
    `;

    if (!labels.length) {
        throw error(404, 'Label with that id not found');
    }

    return new Response(
        JSON.stringify(decryptLabel(labels[0], key)),
        { status: 200 }
    );
};

export const PUT: RequestHandler = async ({ cookies, request, params }) => {
    const { key, id } = await getAuthFromCookies(cookies);
    const body = await request.json();

    if (body.name) {
        body.name = encrypt(body.name, key);

        // check name doesn't already exist
        const label = await query`
            SELECT labels.id
            FROM labels, users
            WHERE name = ${body.name}
                AND labels.user = users.id
                AND users.id = ${id}
        `;
        if (label.length) {
            throw error(400, 'Label with that name already exists');
        }

        // update name
        await query`
            UPDATE labels
            SET name = ${body.name}
            WHERE id = ${params.labelId}
        `;
    }

    if (body.colour) {
        await query`
            UPDATE labels
            SET colour = ${body.colour}
            WHERE id = ${params.labelId}
        `;
    }

    return new Response(
        JSON.stringify({}),
        { status: 200 }
    );
}