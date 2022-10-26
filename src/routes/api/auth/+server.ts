import type { RequestHandler } from "@sveltejs/kit";
import { KEY_HASH } from '$env/static/private';
import { KEY_LS_KEY } from "../../../lib/constants";
import { sha256 } from "js-sha256";

export const GET: RequestHandler = async ({ url, cookies }) => {
    let key: string | undefined | null = url.searchParams.get('key');

    if (!key) {
        key = cookies.get(KEY_LS_KEY);
    }

    if (!key || sha256(key) !== KEY_HASH) {
        return new Response(
            JSON.stringify({ error: 'Invalid key' }),
            { status: 401 }
        );
    }

    cookies.set(KEY_LS_KEY, key, {
        path: '/',
        maxAge: 60 * 60, // one day
        sameSite: 'strict',
        httpOnly: true
    });

    return new Response("{}", {
        status: 200
    });
}