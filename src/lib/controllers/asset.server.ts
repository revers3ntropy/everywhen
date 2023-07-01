import type { Auth } from '$lib/controllers/user';
import { UUID } from '$lib/controllers/uuid';
import type { QueryFunc } from '$lib/db/mysql';
import { decrypt, encrypt } from '$lib/security/encryption';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import fs from 'fs';
import type { ResultSetHeader } from 'mysql2';
import webp from 'webp-converter';
import type { Asset as _Asset } from './asset';
export type Asset = _Asset;
export const Asset = { ...AssetUtils };

namespace AssetUtils {
    export const fileExtToContentType: Readonly<Record<string, string>> = Object.freeze({
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        webp: 'image/webp'
    });

    export async function create(
        query: QueryFunc,
        auth: Auth,
        fileNamePlainText: string,
        contentsPlainText: string,
        created?: TimestampSecs,
        publicId?: string
    ): Promise<Result<{ publicId: string; id: string }>> {
        publicId ??= await UUID.generateUUId(query);
        const id = await UUID.generateUUId(query);
        const fileExt = fileNamePlainText.split('.').pop();
        if (!fileExt) {
            return Result.err('Invalid file extension');
        }
        const contentType = fileExtToContentType[fileExt.toLowerCase()];
        if (!contentType) {
            return Result.err(
                'Unsupported file type. Supported are ' +
                    Object.keys(fileExtToContentType).join(', ') +
                    '.'
            );
        }

        const { err: contentsErr, val: encryptedContents } = encrypt(contentsPlainText, auth.key);
        if (contentsErr) return Result.err(contentsErr);

        const { err: fileNameErr, val: encryptedFileName } = encrypt(fileNamePlainText, auth.key);
        if (fileNameErr) return Result.err(fileNameErr);

        await query`
            INSERT INTO assets (id, publicId, user, created, fileName,
                                contentType, content)
            VALUES (${id},
                    ${publicId},
                    ${auth.id},
                    ${created ?? nowUtc()},
                    ${encryptedFileName},
                    ${contentType},
                    ${encryptedContents})
        `;

        return Result.ok({ publicId, id });
    }

    export async function fromPublicId(
        query: QueryFunc,
        auth: Auth,
        publicId: string
    ): Promise<Result<Asset>> {
        const res = await query<Asset[]>`
            SELECT id,
                   publicId,
                   content,
                   created,
                   fileName,
                   contentType
            FROM assets
            WHERE publicId = ${publicId}
              AND user = ${auth.id}
        `;

        if (res.length !== 1) {
            return Result.err('Asset not found');
        }

        const [row] = res;

        const { err: contentsErr, val: content } = decrypt(row.content, auth.key);
        if (contentsErr) return Result.err(contentsErr);

        const { err: fileNameErr, val: fileName } = decrypt(row.fileName, auth.key);
        if (fileNameErr) return Result.err(fileNameErr);

        return Result.ok({
            id: row.id,
            publicId: row.publicId,
            content,
            fileName,
            contentType: row.contentType,
            created: row.created
        });
    }

    export async function all(query: QueryFunc, auth: Auth): Promise<Result<Asset[]>> {
        const res = await query<Asset[]>`
            SELECT id,
                   publicId,
                   content,
                   created,
                   fileName,
                   contentType
            FROM assets
            WHERE user = ${auth.id}
        `;

        return Result.collect(
            res.map(row => {
                const { err: contentErr, val: content } = decrypt(row.content, auth.key);
                if (contentErr) return Result.err(contentErr);

                const { err: fileNameErr, val: fileName } = decrypt(row.fileName, auth.key);
                if (fileNameErr) return Result.err(fileNameErr);

                return Result.ok({
                    id: row.id,
                    publicId: row.publicId,
                    content,
                    fileName,
                    contentType: row.contentType,
                    created: row.created
                });
            })
        );
    }

    export async function pageOfMetaData(
        query: QueryFunc,
        auth: Auth,
        offset: number,
        count: number
    ): Promise<Result<[Omit<Asset, 'content'>[], number]>> {
        if (count < 1) {
            return Result.err('Count must be positive');
        }

        const res = await query<Omit<Asset, 'content'>[]>`
            SELECT id,
                   publicId,
                   created,
                   fileName,
                   contentType
            FROM assets
            WHERE user = ${auth.id}
            ORDER BY created DESC
            LIMIT ${count}
            OFFSET ${offset}
        `;

        const { err, val: metadata } = Result.collect(
            res.map((row): Result<Asset> => {
                const { err: fileNameErr, val: fileName } = decrypt(row.fileName, auth.key);
                if (fileNameErr) return Result.err(fileNameErr);

                return Result.ok({
                    id: row.id,
                    publicId: row.publicId,
                    content: undefined as unknown as string,
                    fileName,
                    contentType: row.contentType,
                    created: row.created
                });
            })
        );
        if (err) return Result.err(err);

        const [assetCount] = await query<{ count: number }[]>`
            SELECT COUNT(*) as count
            FROM assets
            WHERE user = ${auth.id}
        `;

        return Result.ok([metadata, assetCount.count]);
    }

    export async function purgeAll(query: QueryFunc, auth: Auth): Promise<void> {
        await query`
            DELETE
            FROM assets
            WHERE user = ${auth.id}
        `;
    }

    export async function purgeWithPublicId(
        query: QueryFunc,
        auth: Auth,
        publicId: string
    ): Promise<Result> {
        const res = await query<ResultSetHeader>`
            DELETE
            FROM assets
            WHERE user = ${auth.id}
              AND publicId = ${publicId}
        `;

        if (!res.affectedRows) {
            return Result.err('Asset not found');
        }
        return Result.ok(null);
    }

    export async function base64ToWebP(b64: string, fileExt: string, quality: number) {
        // it's either do it here or when deploying,
        // and doing it here is somehow less painful...
        const exePath = './server/bin/libwebp_linux/bin/cwebp';
        if (fs.existsSync(exePath)) {
            fs.chmodSync(exePath, 0o755);
        }

        const imgB64 = b64.replace(/^data:image\/((jpeg)|(jpg)|(png)|(webp));base64,/, '');

        return await webp.str2webpstr(imgB64, fileExt, `-q ${quality}`);
    }

    export async function updateAssetContentToWebP(
        query: QueryFunc,
        auth: Auth,
        publicId: string,
        webp: string
    ): Promise<Result> {
        const { err: contentsErr, val: encryptedContents } = encrypt(webp, auth.key);
        if (contentsErr) return Result.err(contentsErr);

        await query`
            UPDATE assets
            SET content = ${encryptedContents}
            WHERE publicId = ${publicId}
              AND user = ${auth.id}
        `;
        return Result.ok(null);
    }
}
