import type { RequestHandler } from './$types';
import { query } from '$lib/db/mysql';
import { generateUUId } from "$lib/security/uuid";
import { error } from "@sveltejs/kit";
import { encrypt } from "$lib/security/encryption";
import { getKeyFromRequest } from "$lib/security/getKeyFromRequest";
import { decryptLabels } from "./helper";

export const GET: RequestHandler = async ({ cookies }) => {
    const key = getKeyFromRequest(cookies);

    const labels = await query`
        SELECT 
            id,
            created,
            name,
            colour
        FROM labels
        ORDER BY name
    `;

    return new Response(
        JSON.stringify({
            labels: decryptLabels(labels, key)
        }),
        { status: 200 }
    );
};

export const POST: RequestHandler = async ({ request, cookies }) => {
    const key = getKeyFromRequest(cookies);

    const body = await request.json();

    const id = await generateUUId('label');
    const time = Math.round(Date.now() / 1000);

    if (typeof body.name !== 'string' || !body.name) {
        throw error(400, 'invalid name');
    }
    if (typeof body.colour !== 'string' || !body.colour) {
        throw error(400, 'invalid colour');
    }

    const name = encrypt(body.name, key);

    await query`
        INSERT INTO labels VALUES (
                                   ${id},
                                   ${name},
                                   ${body.colour},
                                   ${time}
        )
   `;

    return new Response(
        JSON.stringify({ id }),
        { status: 201 }
    );
};