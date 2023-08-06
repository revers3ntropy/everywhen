import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals, parent }) => {
    await parent();

    if (locals.auth) {
        throw redirect(307, '/home');
    }
}) satisfies LayoutServerLoad;
