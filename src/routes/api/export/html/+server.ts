import { Export } from '$lib/controllers/export/export.server';
import { api404Handler } from '$lib/utils/apiResponse.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (async ({ locals }) => {
    if (!locals.auth) error(401, 'Unauthorized');

    const [stream, length] = (await Export.generateHTML(locals.auth)).unwrap(e => error(400, e));

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/html',
            'Content-Length': length.toString()
        }
    });
}) satisfies RequestHandler;

export const DELETE = api404Handler;
export const POST = api404Handler;
export const PUT = api404Handler;
