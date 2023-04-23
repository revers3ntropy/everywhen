export class GenericResponse<T> extends Response {
    constructor (val: string, init: ResponseInit) {
        super(val, init);
    }

    protected _ (): T {
        throw new Error('This method should never be called');
    }
}

export function apiResponse<T extends Record<string, unknown>> (
    body: T,
    init: ResponseInit = {},
): GenericResponse<T> {
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
    ) as GenericResponse<T>;
}

export function rawApiResponse<T extends BodyInit | null> (
    body: T,
    init: ResponseInit = {},
): GenericResponse<T> {
    return new Response(
        body,
        {
            status: 200,
            ...init,
        },
    ) as GenericResponse<T>;
}

export function apiRes404 () {
    return apiResponse(
        { status: 404 },
        { status: 404 },
    );
}

apiRes404.isApi404 = true;