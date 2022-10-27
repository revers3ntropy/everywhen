import type { RequestHandler } from "@sveltejs/kit";
import { KEY_HASH } from '$env/static/private';
import { KEY_COOKIE_KEY } from "$lib/constants";
import { sha256 } from "js-sha256";

export const GET: RequestHandler = async ({ url, cookies }) => {
    let key: string | undefined | null = url.searchParams.get('key');

    if (!key) {
        key = cookies.get(KEY_COOKIE_KEY);
    }

    if (!key || sha256(key) !== KEY_HASH) {
        return new Response(
            JSON.stringify({ error: 'Invalid key' }),
            { status: 401 }
        );
    }

    cookies.set(KEY_COOKIE_KEY, key, {
        path: '/',
        maxAge: 60 * 60, // one hour, but will be refreshed on every request
        sameSite: 'strict',
        httpOnly: true
    });

    return new Response("{}", {
        status: 200
    });
}