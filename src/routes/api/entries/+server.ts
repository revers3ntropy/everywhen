import type { RequestHandler } from './$types';
import { query } from '$lib/db/mysql';
import { generateUUId } from "$lib/security/uuid";
import { error } from "@sveltejs/kit";
import { decrypt, encrypt } from "$lib/security/encryption";
import { getKeyFromRequest } from "$lib/security/getKeyFromRequest";

export const GET: RequestHandler = async ({ url, request }) => {
    const key = getKeyFromRequest(request);

    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const page = parseInt(url.searchParams.get('page') || '0');

    if (page < 0) throw error(400, 'Invalid page number');
    if (pageSize < 0) throw error(400, 'Invalid page size');

    const entries = await query`
        SELECT 
            id,
            created,
            latitude,
            longitude,
            title,
            entry,
            deleted,
            label
        FROM entries
        LIMIT ${pageSize}
        OFFSET ${pageSize * page}
    `;

    entries.forEach((entry) => {
        entry.entry = decrypt(entry.entry, key);
        entry.title = decrypt(entry.title, key);
    });

    return new Response(
        JSON.stringify(entries),
        { status: 200 }
    );
};

export const POST: RequestHandler = async ({ request }) => {
    const key = getKeyFromRequest(request);

    const body = await request.json();

    const id = await generateUUId('entry');
    const time = Math.round(Date.now() / 1000);

    if (typeof body.latitude !== 'number') {
        throw error(400, 'latitude must be number');
    }
    if (typeof body.longitude !== 'number') {
        throw error(400, 'longitude must be number');
    }
    if (typeof body.title !== 'string' || !body.title) {
        throw error(400, 'invalid title');
    }
    if (typeof body.entry !== 'string' || !body.entry) {
        throw error(400, 'invalid entry');
    }
    if (body.label && typeof body.label !== 'string') {
        throw error(400, 'invalid label');
    }

    const title = encrypt(body.title, key);
    const entry = encrypt(body.entry, key);

    await query`
        INSERT INTO entries VALUES (
                                    ${id},
                                    ${time},
                                    ${body.latitude},
                                    ${body.longitude},
                                    ${title},
                                    ${entry},
                                    0,
                                    ${body.label || null}
        )
   `;

    return new Response(
        JSON.stringify({ id }),
        { status: 201 }
    );
};