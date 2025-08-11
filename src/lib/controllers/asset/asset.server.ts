import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { UsageLimits } from '$lib/controllers/usageLimits/usageLimits.server';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import type { ResultSetHeader } from 'mysql2';
import type { TimestampSecs } from '../../../types';
import { Asset as _Asset, type AssetMetadata } from './asset';
import { UId } from '$lib/controllers/uuid/uuid.server';
import type { Auth } from '$lib/controllers/auth/auth';
import { query } from '$lib/db/mysql.server';
import { SSLogger } from '$lib/controllers/logs/logs.server';

const logger = new SSLogger('Asset');

namespace AssetServer {
    type Asset = _Asset;

    async function canCreateAssetWithNameAndContent(
        auth: Auth,
        contents: string,
        fileName: string
    ): Promise<string | true> {
        if (contents.length > UsageLimits.LIMITS.asset.contentLenMax) return `File is too big`;

        if (fileName.length < UsageLimits.LIMITS.asset.nameLenMin) return `File name too short`;

        if (fileName.length > UsageLimits.LIMITS.asset.nameLenMax)
            return `File name too long (max ${UsageLimits.LIMITS.asset.nameLenMax})`;

        const [count, max] = await UsageLimits.assetsUsage(
            auth,
            await Subscription.getCurrentSubscription(auth)
        );
        if (count >= max) return `Maximum number of assets (${max}) reached`;

        return true;
    }

    export async function create(
        auth: Auth,
        content: string,
        fileName?: string,
        created?: TimestampSecs,
        publicId?: string
    ): Promise<Result<{ publicId: string; id: string }>> {
        publicId ??= UId.generate();
        fileName ??= '';

        const canCreate = await canCreateAssetWithNameAndContent(auth, content, fileName);
        if (canCreate !== true) return Result.err(canCreate);
        const id = UId.generate();

        await query`
            INSERT INTO assets (id, publicId, userId, created, fileName, content)
            VALUES (${id},
                    ${publicId},
                    ${auth.id},
                    ${created ?? nowUtc()},
                    ${fileName},
                    ${content})
        `;

        return Result.ok({ publicId, id });
    }

    export async function fromPublicId(auth: Auth, publicId: string): Promise<Result<Asset>> {
        const res = await query<
            { id: string; publicId: string; content: string; created: number; fileName: string }[]
        >`
            SELECT id,
                   publicId,
                   content,
                   created,
                   fileName
            FROM assets
            WHERE publicId = ${publicId}
              AND userId = ${auth.id}
        `;
        if (res.length !== 1) {
            // should keep this error as low confidence that publicIds are unique per user
            if (res.length !== 0) {
                await logger.error(
                    `Expected 1 asset with publicId ${publicId} but found ${res.length}`,
                    { publicId, userId: auth.id }
                );
            }
            return Result.err('Asset not found');
        }
        return Result.ok(res[0]);
    }

    export async function all(auth: Auth): Promise<Asset[]> {
        return await query<
            { id: string; publicId: string; content: string; created: number; fileName: string }[]
        >`
            SELECT id,
                   publicId,
                   content,
                   created,
                   fileName
            FROM assets
            WHERE userId = ${auth.id}
        `;
    }

    export async function pageOfMetaData(
        auth: Auth,
        offset: number,
        count: number
    ): Promise<Result<[AssetMetadata[], number]>> {
        if (count < 1) return Result.err('Count must be greater than 0');
        if (isNaN(count)) return Result.err('Count must be a number');
        if (offset < 0) return Result.err('Offset must be positive');
        if (isNaN(offset)) return Result.err('Offset must be a number');

        const metadata = await query<
            { id: string; publicId: string; created: number; fileName: string }[]
        >`
            SELECT id,
                   publicId,
                   created,
                   fileName
            FROM assets
            WHERE userId = ${auth.id}
            ORDER BY created DESC
            LIMIT ${count}
            OFFSET ${offset}
        `;

        const [assetCount] = await query<{ count: number }[]>`
            SELECT COUNT(*) as count
            FROM assets
            WHERE userId = ${auth.id}
        `;

        return Result.ok([metadata, assetCount.count]);
    }

    export async function purgeAll(auth: Auth): Promise<void> {
        await query`
            DELETE
            FROM assets
            WHERE userId = ${auth.id}
        `;
    }

    export async function purgeWithPublicId(auth: Auth, publicId: string): Promise<Result<null>> {
        const res = await query<ResultSetHeader>`
            DELETE
            FROM assets
            WHERE userId = ${auth.id}
              AND publicId = ${publicId}
        `;

        if (!res.affectedRows) {
            return Result.err('Asset not found');
        }
        return Result.ok(null);
    }

    export async function updateEncryptedFields(
        userId: string,
        oldDecrypt: (a: string) => Result<string>,
        newEncrypt: (a: string) => string
    ): Promise<Result<null[], string>> {
        const assets = await query<
            {
                id: string;
                fileName: string;
                content: string;
            }[]
        >`
            SELECT id, fileName, content
            FROM assets
            WHERE userId = ${userId}
        `;

        return await Result.collectAsync(
            assets.map(async (asset): Promise<Result<null>> => {
                const fileNameRes = oldDecrypt(asset.fileName);
                if (!fileNameRes.ok) return fileNameRes.cast();
                const contentRes = oldDecrypt(asset.content);
                if (!contentRes.ok) return contentRes.cast();

                await query`
                    UPDATE assets
                    SET fileName = ${newEncrypt(fileNameRes.val)},
                        content  = ${newEncrypt(contentRes.val)}
                    WHERE id = ${asset.id}
                        AND userId = ${userId}
                `;
                return Result.ok(null);
            })
        );
    }
}

export const Asset = {
    ..._Asset,
    ...AssetServer
};
export type Asset = _Asset;
