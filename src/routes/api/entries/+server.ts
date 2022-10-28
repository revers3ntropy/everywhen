import type { RequestHandler } from './$types';
import { query } from '$lib/db/mysql';
import { generateUUId } from "$lib/security/uuid";
import { error } from "@sveltejs/kit";
import { decrypt, encrypt } from "$lib/security/encryption";
import { getKeyFromCookie } from "../../../lib/security/getKeyFromCookie";
import { addLabelsToEntries, decryptEntries } from "./utils.server";
import type { RawEntry } from "$lib/types";

export const GET: RequestHandler = async ({ url, cookies }) => {
    const key = getKeyFromCookie(cookies);

    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const page = parseInt(url.searchParams.get('page') || '0');
    const allowDeleted = (url.searchParams.get('deleted') || '0') === '1';
    const search = (url.searchParams.get('search') || '').toLowerCase();

    if (page < 0) throw error(400, 'Invalid page number');
    if (pageSize < 0) throw error(400, 'Invalid page size');

    const rawEntries = await query<RawEntry[]>`
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
        WHERE (deleted = 0 OR ${allowDeleted})
        ORDER BY created DESC, id
        LIMIT ${pageSize}
        OFFSET ${pageSize * page}
    `;

    const entries = await addLabelsToEntries(rawEntries, key);

    const numEntries = (await query`
        SELECT title, entry
        FROM entries
        WHERE (deleted = 0 OR ${allowDeleted})
    `).filter((entry) => !search ||
        // decrypt lazily for performance
           decrypt(entry.title, key).toLowerCase().includes(search)
        || decrypt(entry.entry, key).toLowerCase().includes(search)
    ).length;

    const plaintextEntries = decryptEntries(entries, key)
        .filter((entry) => !search ||
                entry.title.toLowerCase().includes(search)
            || entry.entry.toLowerCase().includes(search)
        );

    const response = {
        entries: plaintextEntries,
        page,
        pageSize,
        totalPages: Math.ceil(numEntries / pageSize),
        totalEntries: numEntries
    };

    return new Response(
        JSON.stringify(response),
        { status: 200 }
    );
};

export const POST: RequestHandler = async ({ request, cookies }) => {
    const key = getKeyFromCookie(cookies);

    const body = await request.json();

    const id = await generateUUId();
    const time = Math.round(Date.now() / 1000);

    if (typeof body.latitude !== 'number') {
        throw error(400, 'latitude must be number');
    }
    if (typeof body.longitude !== 'number') {
        throw error(400, 'longitude must be number');
    }
    if (body.title && typeof body.title !== 'string') {
        throw error(400, 'invalid title');
    }
    if (typeof body.entry !== 'string' || !body.entry) {
        throw error(400, 'invalid entry');
    }
    if (body.label && typeof body.label !== 'string') {
        throw error(400, 'invalid label');
    }

    const title = body.title ? encrypt(body.title, key) : '';
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

export const DELETE: RequestHandler = async ({ request, cookies }) => {
    getKeyFromCookie(cookies);

    const body = await request.json();

    if (typeof body.id !== 'string' || !body.id) {
        throw error(400, 'invalid id');
    }

    await query`
        UPDATE entries
        SET deleted = 1
        WHERE id = ${body.id}
   `;

    return new Response(
        JSON.stringify({ id: body.id }),
        { status: 200 }
    );
};