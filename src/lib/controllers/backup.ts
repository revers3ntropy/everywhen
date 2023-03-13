import schemion from 'schemion';
import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { nowS, Result } from '../utils';
import { Asset } from './asset';
import { Controller } from './controller';
import { Entry } from './entry';
import { Label } from './label';
import type { Auth } from './user';

export class Backup extends Controller {
    public constructor (
        public entries: {
            label?: string; // label's name
            entry: string;
            created: number;
            latitude?: number;
            longitude?: number;
            title: string;
        }[],
        public labels: {
            name: string;
            colour: string;
            created: number;
        }[],
        public assets: {
            publicId: string;
            fileName: string;
            content: string;
            created: number;
            contentType: string;
        }[],
        public created: number,
    ) {
        super();
    }

    public static async generate (
        query: QueryFunc,
        auth: Auth,
    ): Promise<Result<Backup>> {
        // use allRaw to keep the label as a string (it's Id)
        const { err, val: entries } = await Entry.all(query, auth);
        if (err) return Result.err(err);

        const labels = await Label.all(query, auth);
        const assets = await Asset.all(query, auth);

        return Result.ok(new Backup(
            entries.map((entry) => ({
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
            labels.map((label) => ({
                name: label.name,
                colour: label.colour,
                created: label.created,
            })),
            assets.map((asset) => ({
                publicId: asset.publicId,
                fileName: asset.fileName,
                content: asset.content,
                created: asset.created,
                contentType: asset.contentType,
            })),
            nowS(),
        ));
    }

    public static async restore (
        query: QueryFunc,
        auth: Auth,
        backupEncrypted: string,
    ): Promise<Result> {
        let decryptedData: unknown;
        try {
            decryptedData = JSON.parse(decrypt(backupEncrypted, auth.key));
        } catch (e) {
            return Result.err('data must be a valid JSON string');
        }

        if (!schemion.matches(decryptedData, {
            entries: 'object',
            labels: 'object',
            assets: 'object',
        })) {
            return Result.err(
                'data must be an object with entries and labels properties',
            );
        }

        const { entries, labels, assets } = decryptedData;
        if (
            !Array.isArray(entries)
            || !Array.isArray(labels)
            || !Array.isArray(assets)
        ) {
            return Result.err(
                'data must be an object with entries and labels properties',
            );
        }

        // set up labels first
        await Label.purgeAll(query, auth);

        for (const label of labels) {
            if (!Label.jsonIsRawLabel(label)) {
                return Result.err('Invalid label format in JSON');
            }

            const { err } = await Label.create(query, auth, label);
            if (err) return Result.err(err);
        }

        await Entry.purgeAll(query, auth);

        for (const entry of entries) {
            if (!Entry.jsonIsRawEntry(entry)) {
                return Result.err('Invalid entry format in JSON');
            }

            if (entry.label) {
                const { err, val } = await Label.getIdFromName(
                    query, auth,
                    entry.label,
                );
                if (err) return Result.err(err);
                entry.label = val;
            }

            const { err } = await Entry.create(query, auth, entry);
            if (err) return Result.err(err);
        }

        await Asset.purgeAll(query, auth);

        for (const asset of assets) {
            if (!Asset.jsonIsRawAsset(asset)) {
                return Result.err('Invalid asset format in JSON');
            }

            const { err } = await Asset.create(
                query, auth,
                asset.fileName, asset.content,
                // make sure to preserve id as this is
                // card coded into entries
                asset.created, asset.publicId,
            );
            if (err) return Result.err(err);
        }

        return Result.ok(null);
    }

    public asEncryptedString (auth: Auth): string {
        return encrypt(JSON.stringify(this), auth.key);
    }
}