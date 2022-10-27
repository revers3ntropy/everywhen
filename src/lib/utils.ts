import { parse } from "cookie";
import { browser } from '$app/environment';
import { KEY_COOKIE_KEY } from "./constants";

export function getKey () {
    if (!browser) throw 'getKey() can only be used in the browser';
    return parse(document.cookie)[KEY_COOKIE_KEY];
}