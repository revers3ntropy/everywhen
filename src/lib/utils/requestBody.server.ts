import type { Auth } from '$lib/controllers/auth/auth';
import { decrypt } from '$lib/utils/encryption';
import { FileLogger } from '$lib/utils/log.server';
import { error } from '@sveltejs/kit';
import schemion, { type Schema, type SchemaResult } from 'schemion';
import { Result } from './result';

const reqLogger = new FileLogger('RQBODY');

export async function bodyFromReq<T extends Schema & Record<string, unknown>>(
    key: Auth | string | null,
    request: Request,
    schema: T,
    defaults: { [P in keyof T]?: SchemaResult<T[P]> | undefined } = {}
): Promise<Result<Readonly<SchemaResult<T>>>> {
    if (request.method === 'GET') {
        void reqLogger.log('GET requests are not supported in bodyFromReq()');
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
        const decryptedRes = decrypt(bodyText, key);
        if (!decryptedRes.ok) return decryptedRes.as();

        try {
            body = JSON.parse(decryptedRes.val);
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
    return (await bodyFromReq(key, request, valueType, defaults)).unwrap(e => error(400, e));
}
