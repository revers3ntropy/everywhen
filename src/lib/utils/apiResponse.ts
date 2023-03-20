export class GenericResponse<T extends Record<string, unknown>> extends Response {
    constructor (val: string, init: ResponseInit) {
        super(val, init);
    }

    protected _ (): T {
        throw new Error('This method should never be called');
    }
}

export function apiResponse<T extends {}> (
    body: T,
    init: ResponseInit = {},
): GenericResponse<T extends Record<string, unknown> ? T : never> {
    if (typeof body !== 'object') {
        throw new Error('Body must be an object');
    }
    if (Array.isArray(body)) {
        throw new Error('Body must not be an array');
    }
    return new Response(
        JSON.stringify(body),
        {
            status: 200,
            ...init,
        },
    ) as GenericResponse<T extends Record<string, unknown> ? T : never>;
}