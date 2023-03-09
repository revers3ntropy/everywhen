import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { generateUUId } from '../security/uuid';
import { nowS, Result } from '../utils';
import { Controller } from './controller';
import type { Auth } from './user';

export class Asset extends Controller {

    public static readonly fileExtToContentType: Readonly<Record<string, string>> =
        Object.freeze({
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
        });

    public constructor (
        public id: string,
        public content: string,
        public fileName: string,
        public contentType: string,
        public created: number,
    ) {
        super();
    }

    public static async create (
        query: QueryFunc,
        auth: Auth,
        fileName: string,
        contentsPlainText: string,
    ): Promise<Result<string>> {
        const id = await generateUUId(query);
        const fileExt = fileName.split('.').pop();
        if (!fileExt) {
            return Result.err('Invalid file extension');
        }
        const contentType = Asset.fileExtToContentType[fileExt.toLowerCase()];
        if (!contentType) {
            return Result.err('Unsupported file type. Supported are ' +
                Object.keys(Asset.fileExtToContentType).join(', ') + '.');
        }

        const encryptedContents = encrypt(contentsPlainText, auth.key);
        const encryptedFileName = encrypt(fileName, auth.key);

        await query`
            INSERT INTO assets (id, user, created, fileName, contentType, content)
            VALUES (${id},
                    ${auth.id},
                    ${nowS()},
                    ${encryptedFileName},
                    ${contentType},
                    ${encryptedContents})
        `;

        return Result.ok(id);
    }

    public static async fromId (
        query: QueryFunc,
        auth: Auth,
        id: string,
    ): Promise<Result<Asset>> {

        const res = await query`
            SELECT id, content, created, fileName, contentType
            FROM assets
            WHERE id = ${id}
              AND user = ${auth.id}
        `;

        if (res.length !== 1) {
            return Result.err('Asset not found');
        }

        const [ row ] = res;
        return Result.ok(new Asset(
            row.id,
            decrypt(row.content, auth.key),
            decrypt(row.fileName, auth.key),
            row.contentType,
            row.created,
        ));
    }
}