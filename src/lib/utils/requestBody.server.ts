import type { Auth } from '$lib/controllers/auth/auth';
import { decrypt } from '$lib/utils/encryption';
import { FileLogger } from '$lib/utils/log.server';
import { error } from '@sveltejs/kit';
import { z } from 'zod';
import type { ZodObject, ZodType } from 'zod';
import { Result } from './result';

const reqLogger = new FileLogger('RequestBody');

export async function bodyFromReq<T extends Record<string, ZodType>>(
    key: Auth | string | null,
    request: Request,
    schema: T
): Promise<Result<Readonly<z.infer<ZodObject<T>>>>> {
    if (request.method === 'GET') {
        void reqLogger.error('GET requests are not supported in bodyFromReq()');
        return Result.err('Something went wrong');
    }

    const contentType = request.headers.get('content-type');
    if (contentType !== 'application/json') {
        return Result.err('Invalid content type on body');
    }

    if (typeof key === 'object' && key !== null) {
        key = key.key;
    }

    const bodyText = await request.text();
    let body: unknown;
    try {
        body = JSON.parse(bodyText);
    } catch (_e) {
        if (!key) return Result.err('Invalid request body');

        const decryptedRes = decrypt(bodyText, key);
        if (!decryptedRes.ok) return decryptedRes.cast();

        try {
            body = JSON.parse(decryptedRes.val);
        } catch (_) {
            return Result.err('Invalid request body');
        }
    }

    if (typeof body !== 'object' || body === null) {
        return Result.err('Invalid request body');
    }

    const parsed = z.object(schema).safeParse(body);
    if (!parsed.success) {
        return Result.err(parsed.error.message);
    }
    return Result.ok(parsed.data);
}

export async function getUnwrappedReqBody<T extends Record<string, ZodType>>(
    key: Auth | string | null,
    request: Request,
    valueType: T
): Promise<Readonly<z.infer<ZodObject<T>>>> {
    return (await bodyFromReq(key, request, valueType)).unwrap(e => error(400, e));
}
