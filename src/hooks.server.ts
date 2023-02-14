import type { Handle } from "@sveltejs/kit";
import { USERNAME_COOKIE_KEY } from "$lib/constants";

process.on("SIGINT", process.exit);
process.on("SIGTERM", process.exit);

export const ssr = false;
export const prerender = false;

export const handle: Handle = async ({ event, resolve }) => {
    console.log(`${ event.cookies.get(USERNAME_COOKIE_KEY) } [${ event.request.method }] ${ event.request.url }`);

    const response = await resolve(event);

    console.log(`   => ${ response.status }`);

    return response;
};

export {};
