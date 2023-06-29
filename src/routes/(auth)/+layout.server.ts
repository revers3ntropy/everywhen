import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (({ locals }) => {
    if (locals.auth) {
        throw redirect(307, '/home');
    }
}) satisfies LayoutServerLoad;
