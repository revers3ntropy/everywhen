import { error } from '@sveltejs/kit';
import schemion from 'schemion';
import { Asset } from '../../../lib/controllers/asset';
import { Entry } from '../../../lib/controllers/entry';
import { Label } from '../../../lib/controllers/label';
import { query } from '../../../lib/db/mysql';
import { decrypt, encrypt } from '../../../lib/security/encryption';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { getUnwrappedReqBody, nowS } from '../../../lib/utils';
import type { RequestHandler } from './$types';

interface Backup {
    entries: {
        label?: string; // label's name
        entry: string;
        created: number;
        latitude?: number;
        longitude?: number;
        title: string;
    }[];
    labels: {
        name: string;
        colour: string;
        created: number;
    }[];
    assets: {
        publicId: string;
        fileName: string;
        content: string;
        created: number;
        contentType: string;
    }[];
    created: number;
}

export const GET: RequestHandler = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    // use allRaw to keep the label as a string (it's Id)
    const { err, val: entries } = await Entry.all(query, auth);
    if (err) throw error(400, err);

    const labels = await Label.all(query, auth);
    const assets = await Asset.all(query, auth);

    const response: Backup = {
        entries: entries.map((entry) => ({
            // replace the label with the label's name
            // can't use ID as will change when labels are restored
            label: entry.label?.name,
            entry: entry.entry,
            created: entry.created,
            // not `null`
            latitude: entry.latitude ?? undefined,
            longitude: entry.longitude ?? undefined,
            title: entry.title,
        })),
        labels: labels.map((label) => ({
            name: label.name,
            colour: label.colour,
            created: label.created,
        })),
        assets: assets.map((asset) => ({
            publicId: asset.publicId,
            fileName: asset.fileName,
            content: asset.content,
            created: asset.created,
            contentType: asset.contentType,
        })),
        created: nowS(),
    };

    // encrypt response as this is the data
    // that will be downloaded to the user's device
    const encryptedResponse = encrypt(JSON.stringify(response), auth.key);

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
        assets: 'object',
    })) {
        throw error(
            400,
            'data must be an object with entries and labels properties',
        );
    }

    const { entries, labels, assets } = decryptedData;
    if (
        !Array.isArray(entries)
        || !Array.isArray(labels)
        || !Array.isArray(assets)
    ) {
        throw error(400, 'data must be an object with entries and labels properties');
    }

    // set up labels first
    await Label.purgeAll(query, auth);

    for (const label of labels) {
        if (!Label.jsonIsRawLabel(label)) {
            throw error(400, 'Invalid label format in JSON');
        }

        const { err } = await Label.create(query, auth, label);
        if (err) throw error(400, err);
    }

    await Entry.purgeAll(query, auth);

    for (const entry of entries) {
        if (!Entry.jsonIsRawEntry(entry)) {
            throw error(400, 'Invalid entry format in JSON');
        }

        if (entry.label) {
            const { err, val } = await Label.getIdFromName(query, auth, entry.label);
            if (err) throw error(400, err);
            entry.label = val;
        }

        const { err } = await Entry.create(query, auth, entry);
        if (err) throw error(400, err);
    }

    await Asset.purgeAll(query, auth);

    for (const asset of assets) {
        if (!Asset.jsonIsRawAsset(asset)) {
            throw error(400, 'Invalid asset format in JSON');
        }

        const { err } = await Asset.create(
            query, auth,
            asset.fileName, asset.content,
            // make sure to preserve id as this is
            // card coded into entries
            asset.created, asset.publicId,
        );
        if (err) throw error(400, err);
    }

    return new Response(
        JSON.stringify({}),
        { status: 200 },
    );
};