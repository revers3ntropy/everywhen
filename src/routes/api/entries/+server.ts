import type { RequestHandler } from "./$types";
import { query } from "../../../lib/db/mysql";
import { generateUUId } from "../../../lib/security/uuid";
import { error } from "@sveltejs/kit";
import { decrypt, encrypt } from "../../../lib/security/encryption";
import { getAuthFromCookies } from "../../../lib/security/getAuthFromCookies";
import { addLabelsToEntries, decryptEntries } from "./utils.server";
import type { RawEntry } from "../../../lib/types";

export const GET: RequestHandler = async ({ url, cookies }) => {
    const { key, id } = await getAuthFromCookies(cookies);

    const pageSize = parseInt(url.searchParams.get("pageSize") || "50");
    const page = parseInt(url.searchParams.get("page") || "0");
    const deleted = url.searchParams.get("deleted") === "1";
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const labelId = url.searchParams.get("labelId");

    if (page < 0) throw error(400, "Invalid page number");
    if (!pageSize || pageSize < 0) throw error(400, "Invalid page size");

    const rawEntries = await query<RawEntry[]>`
        SELECT entries.id,
               entries.created,
               entries.latitude,
               entries.longitude,
               entries.title,
               entries.entry,
               entries.deleted,
               entries.label
        FROM entries,
             users
        WHERE deleted = ${ deleted }
          AND entries.user = users.id
          AND users.id = ${ id }
          AND (entries.label = ${ labelId } OR ${ !labelId })
        ORDER BY created DESC, id
        LIMIT ${ pageSize } OFFSET ${ pageSize * page }
    `;

    const entries = await addLabelsToEntries(rawEntries, key);

    const numEntries = (
        await query`
            SELECT title, entry
            FROM entries
            WHERE deleted = ${ deleted }
        `).filter(
        (entry) =>
            !search ||
            // decrypt lazily for performance
            decrypt(entry.title, key).toLowerCase().includes(search) ||
            decrypt(entry.entry, key).toLowerCase().includes(search)
    ).length;

    const plaintextEntries = decryptEntries(entries, key).filter(
        (entry) =>
            !search ||
            entry.title.toLowerCase().includes(search) ||
            entry.entry.toLowerCase().includes(search)
    );

    const response = {
        entries: plaintextEntries,
        page,
        pageSize,
        totalPages: Math.ceil(numEntries / pageSize),
        totalEntries: numEntries
    };

    return new Response(JSON.stringify(response), { status: 200 });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
    const { key, id: userId } = await getAuthFromCookies(cookies);

    const body = await request.json();

    const id = await generateUUId();

    if (body.created && typeof body.created !== "number") {
        throw error(400, "time must be number");
    }
    const time = body.created || Math.round(Date.now() / 1000);

    if (typeof body.latitude !== "number") {
        throw error(400, "latitude must be number");
    }
    if (typeof body.longitude !== "number") {
        throw error(400, "longitude must be number");
    }
    if (body.title && typeof body.title !== "string") {
        throw error(400, "Title must be a string");
    }
    if (!body.entry) {
        throw error(400, "Entry body required");
    }
    if (typeof body.entry !== "string") {
        throw error(400, "Entry must be a string");
    }
    if (body.label && typeof body.label !== "string") {
        throw error(400, "Invalid label");
    }

    const title = body.title ? encrypt(body.title, key) : "";
    const entry = encrypt(body.entry, key);

    // check label exists
    if (body.label) {
        const label = await query`
            SELECT labels.id
            FROM labels,
                 users
            WHERE labels.id = ${ body.label }
              AND user = users.id
              AND users.id = ${ userId }
        `;
        if (!label.length) {
            throw error(400, "Label doesn't exist");
        }
    }

    await query`
        INSERT INTO entries (id,
                             created,
                             latitude,
                             longitude,
                             title, entry,
                             deleted,
                             label,
                             user)
        VALUES (${ id },
                ${ time },
                ${ body.latitude || null },
                ${ body.longitude || null },
                ${ title || null },
                ${ entry },
                0,
                ${ body.label || null },
                ${ userId })
    `;

    return new Response(JSON.stringify({ id }), { status: 201 });
};
