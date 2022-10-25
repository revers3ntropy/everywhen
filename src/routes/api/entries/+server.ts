import type { RequestHandler } from './$types';
import { query } from '$lib/db/mysql';
import { generateUUId } from "$lib/security/uuid";

export const GET: RequestHandler = async ({ url }) => {

    const entries = await query`SELECT * FROM entries`;

    return new Response(JSON.stringify(entries));
};

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();

    const id = generateUUId('entry');

    await query`
        INSERT INTO entries VALUES (
                                    ${id},
                                    ${Date.now() / 1000},
                                    ${body.latitude},
                                    ${body.longitude},
                                    ${body.title},
                                    ${body.entry},
                                    0,
                                    ${body.label || null}
        )
   `;

    return new Response('', { status: 201 });
};