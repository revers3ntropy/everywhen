import type { PageServerLoad } from './$types';

export const load = (({ url }) => {
    const redirect = url.searchParams.get('redirect') || 'home';
    console.log('hi');
    return {
        redirect: redirect
            .trim()
            // remove leading slashes, which might redirect to another site
            .replace(/^\/+/g, '')
    };
}) satisfies PageServerLoad;
