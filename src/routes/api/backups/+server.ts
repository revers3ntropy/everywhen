import type { RequestHandler } from "./$types";
import { getAuthFromCookies } from "$lib/security/getAuthFromCookies";
import { addLabelsToEntries, decryptEntries } from "../entries/utils.server";
import { query } from "$lib/db/mysql";
import type { Label, RawEntry } from "$lib/types";
import { decryptLabels } from "../labels/utils.server";
import { decrypt, encrypt } from "$lib/security/encryption";
import { error } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ cookies }) => {
    const { key, id } = await getAuthFromCookies(cookies);

    const entriesResult = await query<RawEntry[]>`
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
        WHERE entries.user = users.id
          AND users.id = ${ id }
        ORDER BY entries.created DESC, entries.id
    `;
    const entries = decryptEntries(entriesResult, key);

    const labelsResult = await query<Label[]>`
        SELECT name, colour, created, id
        FROM labels
        WHERE user = ${ id }
    `;
    const labels = decryptLabels(labelsResult, key);

    const response = {
        entries,
        labels
    };

    const encryptedResponse = encrypt(JSON.stringify(response), key);

    return new Response(
        JSON.stringify({ data: encryptedResponse }),
        { status: 200 }
    );
};

export const POST: RequestHandler = async ({ request, cookies }) => {
    const { key, id: userId } = await getAuthFromCookies(cookies);
    const { data } = await request.json();

    if (typeof data !== "string") {
        throw error(400, "data must be a string");
    }

    let decryptedData;
    try {
        decryptedData = JSON.parse(decrypt(data, key));
    } catch (e) {
        throw error(400, "data must be a valid JSON string");
    }

    const { entries, labels } = decryptedData;
    if (!Array.isArray(entries) || !Array.isArray(labels)) {
        throw error(400, "data must be an object with entries and labels properties");
    }

    for (const entry of entries) {
        const { id, created, title, entry: text, latitude, longitude, label, deleted } = entry;

        if (
            typeof title !== "string"
            || typeof text !== "string"
            || typeof latitude !== "number"
            || typeof longitude !== "number"
            || (typeof label !== "string" && label !== null)
            || typeof created !== "number"
            || typeof id !== "string"
        ) {
            throw error(400, "Invalid entry format in JSON");
        }

        await query`
            DELETE
            FROM entries
            WHERE id = ${ id }
        `;

        const entryText = encrypt(text, key);
        const entryTitle = encrypt(title, key);

        await query`
            INSERT INTO entries (id, created, user, title, entry, latitude, longitude, label, deleted)
            VALUES (${ id }, ${ created }, ${ userId }, ${ entryTitle }, ${ entryText }, ${ latitude }, ${ longitude },
                    ${ label },
                    ${ !!deleted })
        `;
    }

    for (const label of labels) {
        const { id, name, colour, created } = label;
        if (
            typeof name !== "string"
            || typeof colour !== "string"
            || typeof created !== "number"
            || typeof id !== "string"
        ) {
            throw error(400, "Invalid label format in JSON");
        }

        await query`
            DELETE
            FROM labels
            WHERE id = ${ id }
        `;

        const entryName = encrypt(name, key);

        await query`
            INSERT INTO labels (id, created, user, name, colour)
            VALUES (${ id }, ${ created }, ${ userId }, ${ entryName }, ${ colour })
        `;
    }

    return new Response(
        JSON.stringify({}),
        { status: 200 }
    );
};