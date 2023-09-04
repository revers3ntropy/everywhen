import { redirectPath } from '../getRedirectPath.server';
import type { PageServerLoad } from './$types';

export const load = (({ url }) => {
    return {
        redirect: redirectPath(url)
    };
}) satisfies PageServerLoad;
