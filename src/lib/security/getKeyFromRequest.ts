import { sha256 } from "js-sha256";
import { type Cookies, error } from "@sveltejs/kit";
import { KEY_COOKIE_KEY } from "../constants";
import { KEY_HASH } from '$env/static/private';

export function getKeyFromRequest(request: Cookies): string {
    const key = request.get(KEY_COOKIE_KEY);
    if (!key || sha256(key) !== KEY_HASH) {
        throw error(401, `Invalid key`);
    }
    return key;
}