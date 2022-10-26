import type { HttpMethod } from "@sveltejs/kit/types/private";
import { browser } from "$app/environment";

/*
import { page } from '$app/stores';

export async function ssApi (method: HttpMethod, path: string, body: any = null) {
    return await new Promise((resolve) => {
        const unsub = page.subscribe(async (page) => {

            // extract protocol and host from page.url
            path = `${page.url.href.split('/')[0]}//${page.url.host}/api${path}`;

            const init: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            if (body) {
                init.body = JSON.stringify(body)
            }

            const response = await fetch(path, init).catch(e => {
                console.error(path, init, e);
            });

            if (!response) {
                console.error(`No response on path '${path}'`);
                return;
            }

            if (response.ok) {
                resolve(await response.json());
            } else {
                console.error('Error on server side api fetch', method,
                    path + ':', response.status, await response.text());
                resolve({
                    status: response.status,
                    statusText: response.statusText
                });
            }

            unsub();
        });
    });
}

 */

export async function makeApiReq (method: HttpMethod, path: string, body: any = null) {
    if (!browser) {
        return;
    }

    path = `/api${path}`

    const init: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (body) {
        init.body = JSON.stringify(body)
    }

    const response = await fetch(path, init);

    if (response.ok) {
        return await response.json();
    } else {
        console.error('Error on client side api fetch', method, path,
            'Gave erroneous response:', response);
        return response;
    }
}

export const api = {
    get: async (path: string) => await makeApiReq('GET', path),
    post: async (path: string, body: any) => await makeApiReq('POST', path, body),
    put: async (path: string, body: any) => await makeApiReq('PUT', path, body),
    delete: async (path: string, body: any) => await makeApiReq('DELETE', path, body)
}