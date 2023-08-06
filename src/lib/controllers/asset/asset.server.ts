import { decrypt, encrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import fs from 'fs';
import type { ResultSetHeader } from 'mysql2';
import webp from 'webp-converter';
import { z } from 'zod';
import { Asset as _Asset, type AssetMetadata } from './asset';
import { UUIdControllerServer } from '$lib/controllers/uuid/uuid.server';
import type { Auth } from '$lib/controllers/auth/auth';
import { query } from '$lib/db/mysql.server';

namespace AssetServer {
    type Asset = _Asset;

    export async function create(
        auth: Auth,
        fileNamePlainText: string,
        contentsPlainText: string,
        created?: TimestampSecs,
        publicId?: string
    ): Promise<Result<{ publicId: string; id: string }>> {
        publicId ??= await UUIdControllerServer.generate();
        const id = await UUIdControllerServer.generate();
        const fileExt = fileNamePlainText.split('.').pop();
        if (!fileExt) {
            return Result.err('Invalid file extension');
        }

        const encryptedContents = encrypt(contentsPlainText, auth.key);

        const encryptedFileName = encrypt(fileNamePlainText, auth.key);

        await query`
            INSERT INTO assets (id, publicId, user, created, fileName, content)
            VALUES (${id},
                    ${publicId},
                    ${auth.id},
                    ${created ?? nowUtc()},
                    ${encryptedFileName},
                    ${encryptedContents})
        `;

        return Result.ok({ publicId, id });
    }

    export async function fromPublicId(auth: Auth, publicId: string): Promise<Result<Asset>> {
        const res = await query<Asset[]>`
            SELECT id,
                   publicId,
                   content,
                   created,
                   fileName
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
            created: row.created
        });
    }

    export async function all(auth: Auth): Promise<Result<Asset[]>> {
        const res = await query<Asset[]>`
            SELECT id,
                   publicId,
                   content,
                   created,
                   fileName
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
                    created: row.created
                });
            })
        );
    }

    export async function pageOfMetaData(
        auth: Auth,
        offset: number,
        count: number
    ): Promise<Result<[AssetMetadata[], number]>> {
        if (count < 1) {
            return Result.err('Count must be positive');
        }

        const res = await query<AssetMetadata[]>`
            SELECT id,
                   publicId,
                   created,
                   fileName
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

    export async function purgeAll(auth: Auth): Promise<void> {
        await query`
            DELETE
            FROM assets
            WHERE user = ${auth.id}
        `;
    }

    export async function purgeWithPublicId(auth: Auth, publicId: string): Promise<Result> {
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
        auth: Auth,
        publicId: string,
        webp: string
    ): Promise<Result> {
        const encryptedContents = encrypt(webp, auth.key);

        await query`
            UPDATE assets
            SET content = ${encryptedContents}
            WHERE publicId = ${publicId}
              AND user = ${auth.id}
        `;
        return Result.ok(null);
    }

    export function jsonIsRawAsset(json: unknown): json is Omit<Asset, 'id'> {
        const schema = z.object({
            publicId: z.string(),
            content: z.string(),
            fileName: z.string(),
            created: z.number()
        });
        return schema.safeParse(json).success;
    }
}

export const Asset = {
    ..._Asset,
    Server: AssetServer
};
export type Asset = _Asset;
