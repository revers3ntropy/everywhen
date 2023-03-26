import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { Result } from '../utils/result';
import { nowS } from '../utils/time';
import type { Auth } from './user';
import { UUID } from './uuid';

export class Asset {

    public static readonly fileExtToContentType: Readonly<Record<string, string>> =
        Object.freeze({
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
        });

    public constructor (
        public id: string,
        public publicId: string,
        public content: string,
        public fileName: string,
        public contentType: string,
        public created: number,
    ) {
    }

    public static async create (
        query: QueryFunc,
        auth: Auth,
        fileNamePlainText: string,
        contentsPlainText: string,
        created?: number,
        publicId?: string,
    ): Promise<Result<string>> {
        publicId ??= await UUID.generateUUId(query);
        const id = await UUID.generateUUId(query);
        const fileExt = fileNamePlainText.split('.').pop();
        if (!fileExt) {
            return Result.err('Invalid file extension');
        }
        const contentType = Asset.fileExtToContentType[fileExt.toLowerCase()];
        if (!contentType) {
            return Result.err('Unsupported file type. Supported are ' +
                Object.keys(Asset.fileExtToContentType).join(', ') + '.');
        }

        const {
            err: contentsErr,
            val: encryptedContents,
        } = encrypt(contentsPlainText, auth.key);
        if (contentsErr) return Result.err(contentsErr);

        const {
            err: fileNameErr,
            val: encryptedFileName,
        } = encrypt(fileNamePlainText, auth.key);
        if (fileNameErr) return Result.err(fileNameErr);

        await query`
            INSERT INTO assets (id, publicId, user, created, fileName, contentType, content)
            VALUES (${id},
                    ${publicId},
                    ${auth.id},
                    ${created ?? nowS()},
                    ${encryptedFileName},
                    ${contentType},
                    ${encryptedContents})
        `;

        return Result.ok(publicId);
    }

    public static async fromPublicId (
        query: QueryFunc,
        auth: Auth,
        publicId: string,
    ): Promise<Result<Asset>> {

        const res = await query`
            SELECT id, publicId, content, created, fileName, contentType
            FROM assets
            WHERE publicId = ${publicId}
              AND user = ${auth.id}
        `;

        if (res.length !== 1) {
            return Result.err('Asset not found');
        }

        const [ row ] = res;

        const { err: contentsErr, val: contents } = decrypt(row.content, auth.key);
        if (contentsErr) return Result.err(contentsErr);

        const { err: fileNameErr, val: fileName } = decrypt(row.fileName, auth.key);
        if (fileNameErr) return Result.err(fileNameErr);

        return Result.ok(new Asset(
            row.id,
            row.publicId,
            contents,
            fileName,
            row.contentType,
            row.created,
        ));
    }

    public static async all (
        query: QueryFunc,
        auth: Auth,
    ): Promise<Result<Asset[]>> {
        const res = await query<Asset[]>`
            SELECT id, publicId, content, created, fileName, contentType
            FROM assets
            WHERE user = ${auth.id}
        `;

        return Result.collect(res.map(row => {
            const { err: contentErr, val: content } = decrypt(row.content, auth.key);
            if (contentErr) return Result.err(contentErr);

            const { err: fileNameErr, val: fileName } = decrypt(row.fileName, auth.key);
            if (fileNameErr) return Result.err(fileNameErr);

            return Result.ok(new Asset(
                row.id,
                row.publicId,
                content,
                fileName,
                row.contentType,
                row.created,
            ));
        }));
    }

    public static async purgeAll (query: QueryFunc, auth: Auth): Promise<void> {
        query`
            DELETE
            FROM assets
            WHERE user = ${auth.id}
        `;
    }

    public static jsonIsRawAsset (
        json: unknown,
    ): json is Omit<Asset, 'id'> {
        return typeof json === 'object' &&
            json !== null &&
            'publicId' in json &&
            typeof json.publicId === 'string' &&
            'content' in json &&
            typeof json.content === 'string' &&
            'fileName' in json &&
            typeof json.fileName === 'string' &&
            'contentType' in json &&
            typeof json.contentType === 'string' &&
            'created' in json &&
            typeof json.created === 'number';
    }
}