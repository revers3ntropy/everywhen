import { error, type NumericRange } from '@sveltejs/kit';

export interface HttpError {
    status: NumericRange<400, 599>;
    body: { message: string };
}

export function httpError(status: NumericRange<400, 599>, message: string): HttpError {
    try {
        error(status, message);
    } catch (e: unknown) {
        return e as HttpError;
    }
}
