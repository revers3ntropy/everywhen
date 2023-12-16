import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals, parent }) => {
    await parent();

    if (locals.auth) {
        redirect(307, '/journal?x=1');
    }
}) satisfies LayoutServerLoad;
