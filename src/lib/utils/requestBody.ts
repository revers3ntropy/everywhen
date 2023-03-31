import { error } from '@sveltejs/kit';
import schemion, { type Schema, type SchemaResult } from 'schemion';
import { Result } from './result';

export async function bodyFromReq<T extends Schema & object> (
    request: Request,
    schema: T,
    defaults: { [P in keyof T]?: SchemaResult<T[P]> | undefined; } = {},
): Promise<Result<Readonly<SchemaResult<T>>>> {
    if (request.method === 'GET') {
        throw 'GET requests are not supported in bodyFromReq()';
    }

    const contentType = request.headers.get('content-type');
    if (contentType !== 'application/json') {
        return Result.err('Invalid content type on body');
    }

    const body = await request.json() as Record<string, unknown> | null;
    if (typeof body !== 'object' || body === null) {
        return Result.err('Invalid body: not JSON');
    }

    if (!schemion.matches(
        body,
        schema,
        defaults as T extends object ? { [P in keyof T]?: SchemaResult<T[P]> | undefined; } | null : null,
    )) {
        return Result.err(`Invalid body: does not match expected schema`);
    }

    return Result.ok(Object.freeze(
        body as SchemaResult<T>,
    ));
}

export async function getUnwrappedReqBody<T extends Schema & object & {
    timezoneUtcOffset?: 'number',
    utcTimeS?: 'number',
}> (
    request: Request,
    valueType: T,
    defaults: { [P in keyof T]?: SchemaResult<T[P]> } = {},
): Promise<Readonly<SchemaResult<T>>> {
    const res = await bodyFromReq(request, valueType, defaults);
    if (res.err) {
        throw error(400, res.err);
    }
    return res.val;
}