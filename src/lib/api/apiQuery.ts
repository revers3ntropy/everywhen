import type { HttpMethod } from "@sveltejs/kit/types/private";
import { browser } from "$app/environment";
import { page } from '$app/stores';

export async function ssApi (method: HttpMethod, path: string, body: any = null) {
    return await new Promise((resolve) => {
        const unsub = page.subscribe(async (page) => {

            path = `${page.url.host}/api${path}`;

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
                resolve(await response.json());
            } else {
                console.error(method, path + ':', response);
                resolve({
                    status: response.status,
                    statusText: response.statusText
                });
            }

            unsub();
        });
    });
}

export async function api (method: HttpMethod, path: string, body: any = null) {

    if (!browser) {
        // make same api request but server side
        return ssApi(method, path, body);
    } else {
        path = `/api${path}`
    }

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
        console.error(method, path, 'Gave erroneous response:', response);
        return {
            status: response.status,
            statusText: response.statusText
        }
    }
}