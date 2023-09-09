import { encrypt } from '$lib/utils/encryption';
import { Auth } from '$lib/controllers/auth/auth.server';
import type { RequestHandler } from '@sveltejs/kit';

export class GenericResponse<T> extends Response {
    protected _(): T {
        throw new Error('This method should never be called');
    }
}

export function apiResponse<T extends Record<string, unknown>>(
    encryptionKey: string | Auth | null,
    body: T,
    init: ResponseInit = {}
): GenericResponse<T> {
    if (typeof body !== 'object') {
        throw new Error('Body must be an object');
    }
    if (Array.isArray(body)) {
        throw new Error('Body must not be an array');
    }

    let key: string;
    if (encryptionKey === null) {
        key = '';
    } else if (typeof encryptionKey === 'string') {
        key = encryptionKey;
    } else {
        key = encryptionKey.key;
    }

    let resBody: string;
    if (key) {
        resBody = encrypt(JSON.stringify(body), key);
    } else {
        resBody = JSON.stringify(body);
    }
    return new Response(resBody, {
        status: 200,
        ...init
    }) as GenericResponse<T>;
}

export const apiRes404: RequestHandler & { isApi404: true } = ({ cookies }) => {
    const auth = Auth.tryGetAuthFromCookies(cookies);
    return apiResponse(auth, { status: 404 }, { status: 404 });
};

apiRes404.isApi404 = true;
