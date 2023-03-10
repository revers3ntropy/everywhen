import { error } from '@sveltejs/kit';
import schemion from 'schemion';
import { type DecryptedRawEntry, Entry } from '../../../lib/controllers/entry';
import { Label } from '../../../lib/controllers/label';
import { query } from '../../../lib/db/mysql';
import { decrypt, encrypt } from '../../../lib/security/encryption';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { getUnwrappedReqBody } from '../../../lib/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const {
        val: entries,
        err,
    } = await Entry.decryptRaw(auth, await Entry.allRaw(query, auth));
    if (err) throw error(500, err);

    // encrypt response as this is the data
    // that will be downloaded to the user's device
    const encryptedResponse = encrypt(JSON.stringify({
        entries,
        labels: await Label.all(query, auth),
    }), auth.key);

    return new Response(
        JSON.stringify({ data: encryptedResponse }),
        { status: 200 },
    );
};

export const POST: RequestHandler = async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const body = await getUnwrappedReqBody(request, {
        data: 'string',
    });

    let decryptedData: unknown;
    try {
        decryptedData = JSON.parse(decrypt(body.data, auth.key));
    } catch (e) {
        throw error(400, 'data must be a valid JSON string');
    }

    if (!schemion.matches(decryptedData, {
        entries: 'object',
        labels: 'object',
    })) {
        throw error(
            400,
            'data must be an object with entries and labels properties',
        );
    }

    const { entries, labels } = decryptedData;
    if (!Array.isArray(entries) || !Array.isArray(labels)) {
        throw error(400, 'data must be an object with entries and labels properties');
    }

    for (const entry of entries) {
        if (!Entry.jsonIsRawEntry<DecryptedRawEntry>(entry)) {
            throw error(400, 'Invalid entry format in JSON');
        }

        await Entry.purgeWithId(query, auth, entry.id);
        const { err } = await Entry.create(query, auth, entry);
        if (err) throw error(400, err);
    }

    for (const label of labels) {
        if (!Label.jsonIsRawLabel(label)) {
            throw error(400, 'Invalid label format in JSON');
        }

        await Label.purgeWithId(query, auth, label.id);
        const { err } = await Label.create(query, auth, label);
        if (err) throw error(400, err);
    }

    return new Response(
        JSON.stringify({}),
        { status: 200 },
    );
};