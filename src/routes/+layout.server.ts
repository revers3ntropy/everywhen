import type { LayoutServerLoad } from './$types';

export const prerender = false;
export const ssr = true;
export const csr = true;

export const load = (({ locals }) => {
    return {
        __cookieWritables: locals.__cookieWritables
    };
}) satisfies LayoutServerLoad;
