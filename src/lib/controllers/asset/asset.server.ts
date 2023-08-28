import { MAXIMUM_ENTITIES } from '$lib/constants';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import type { ResultSetHeader } from 'mysql2';
import { Asset as _Asset, type AssetMetadata } from './asset';
import { UId } from '$lib/controllers/uuid/uuid.server';
import type { Auth } from '$lib/controllers/auth/auth';
import { query } from '$lib/db/mysql.server';

namespace AssetServer {
    type Asset = _Asset;

    export async function create(
        auth: Auth,
        contentsPlainText: string,
        fileNamePlainText?: string,
        created?: TimestampSecs,
        publicId?: string
    ): Promise<Result<{ publicId: string; id: string }>> {
        const numEntries = await query<{ count: number }[]>`
            SELECT COUNT(*) as count
            FROM assets
            WHERE user = ${auth.id}
        `;
        if (numEntries[0].count >= MAXIMUM_ENTITIES.asset) {
            return Result.err(`Maximum number of assets (${MAXIMUM_ENTITIES.asset}) reached`);
        }

        publicId ??= await UId.Server.generate();
        const id = await UId.Server.generate();
        fileNamePlainText ??= `${publicId}`;

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

    export async function purgeWithPublicId(auth: Auth, publicId: string): Promise<Result<null>> {
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
}

export const Asset = {
    ..._Asset,
    Server: AssetServer
};
export type Asset = _Asset;
