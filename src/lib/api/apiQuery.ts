import type { HttpMethod } from "@sveltejs/kit/types/private";
import { serialize } from "cookie";
import { KEY_COOKIE_KEY } from "../constants";
import { browser } from '$app/environment';
import { PUBLIC_SVELTEKIT_PORT } from '$env/static/public';

export async function makeApiReq (key: string, method: HttpMethod, path: string, body: any = null) {

    let url = `/api${path}`;
    if (!browser) {
        url = `http://localhost:${PUBLIC_SVELTEKIT_PORT}${url}`;
    }

    const init: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cookie': serialize(KEY_COOKIE_KEY, key, {
                path: '/',
                maxAge: 60,
                sameSite: 'strict',
                httpOnly: true
            })
        }
    };
    if (body) {
        init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (response.ok) {
        return await response.json();
    } else {
        if (response.status === 401 && browser) {
            location.reload();
        }
        console.error(`Error on api fetch (${browser ? 'client' : 'server'} side)`,
            method, url, 'Gave erroneous response:', response);
        return response;
    }
}

export const api = {
    get: async (key: string, path: string) =>
        await makeApiReq(key, 'GET', path),
    post: async (key: string, path: string, body: any) =>
        await makeApiReq(key, 'POST', path, body),
    put: async (key: string, path: string, body: any) =>
        await makeApiReq(key, 'PUT', path, body),
    delete: async (key: string, path: string, body: any) =>
        await makeApiReq(key, 'DELETE', path, body)
}