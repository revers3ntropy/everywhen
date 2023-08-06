import type { Auth } from '$lib/controllers/auth/auth';
import { decrypt } from '$lib/utils/encryption';
import { error } from '@sveltejs/kit';
import schemion, { type Schema, type SchemaResult } from 'schemion';
import { errorLogger } from './log.server';
import { Result } from './result';

export async function bodyFromReq<T extends Schema & Record<string, unknown>>(
    key: Auth | string | null,
    request: Request,
    schema: T,
    defaults: { [P in keyof T]?: SchemaResult<T[P]> | undefined } = {}
): Promise<Result<Readonly<SchemaResult<T>>>> {
    if (request.method === 'GET') {
        void errorLogger.log('GET requests are not supported in bodyFromReq()');
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
    } catch (e) {
        if (!key) {
            return Result.err('Invalid request body');
        }
        const { err, val: decryptedRes } = decrypt(bodyText, key);
        if (err) return Result.err(err);

        try {
            body = JSON.parse(decryptedRes);
        } catch (e) {
            return Result.err('Invalid request body');
        }
    }

    if (typeof body !== 'object' || body === null) {
        return Result.err('Invalid request body');
    }

    if (
        !schemion.matches(
            body,
            schema,
            defaults as T extends object
                ? { [P in keyof T]?: SchemaResult<T[P]> | undefined } | null
                : null
        )
    ) {
        return Result.err(`Invalid body: does not match expected schema`);
    }

    return Result.ok(Object.freeze(body as SchemaResult<T>));
}

export async function getUnwrappedReqBody<
    T extends Schema &
        Record<string, unknown> & {
            timezoneUtcOffset?: 'number';
            utcTimeS?: 'number';
        }
>(
    key: Auth | string | null,
    request: Request,
    valueType: T,
    defaults: { [P in keyof T]?: SchemaResult<T[P]> } = {}
): Promise<Readonly<SchemaResult<T>>> {
    const res = await bodyFromReq(key, request, valueType, defaults);
    if (res.err) {
        throw error(400, res.err);
    }
    return res.val;
}
