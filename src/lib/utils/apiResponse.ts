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
): GenericResponse<T> {
    return new Response(
        JSON.stringify(body),
        {
            status: 200,
            ...init,
        },
    ) as GenericResponse<T>;
}