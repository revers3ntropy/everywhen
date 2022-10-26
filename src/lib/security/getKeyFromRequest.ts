import { sha256 } from "js-sha256";
import { error } from "@sveltejs/kit";

export function getKeyFromRequest(request: Request): string {
    const key = request.headers.get('Bearer');
    if (!key || sha256(key) !== process.env.KEY_HASH) {
        throw error(401, 'Invalid key');
    }
    return key;
}