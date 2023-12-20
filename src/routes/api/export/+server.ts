import { Auth } from '$lib/controllers/auth/auth.server';
import { Entry } from '$lib/controllers/entry/entry.server';
import type { GenericResponse } from '$lib/utils/apiResponse.server';
import { httpError } from '$lib/utils/httpError';
import { PdfBuilder } from '$lib/utils/pdf.server';
import { Result } from '$lib/utils/result';
import { fmtUtc } from '$lib/utils/time';
import { error } from '@sveltejs/kit';
import { cacheResponse, getCachedResponse } from '$lib/utils/cache.server';
import type { RequestHandler } from '../../../../.svelte-kit/types/src/routes/api/entries/[entryId]/$types';
export const GET = (async ({ url, cookies }) => {
    // hide behind 'feature flag'
    Result.err(httpError(404, 'Page not found')).unwrap();

    const auth = Auth.getAuthFromCookies(cookies);

    const cached = getCachedResponse<Response>(url.href, auth.id);
    if (cached) return cached.clone() as GenericResponse<Buffer>;

    const pdf = new PdfBuilder();

    const days = Entry.groupEntriesByDay((await Entry.all(auth)).unwrap(e => error(400, e)));

    for (const day in days) {
        pdf.h1(day);

        for (const entry of days[day]) {
            pdf.p(fmtUtc(entry.created, entry.createdTzOffset, 'h:mma'));
            pdf.space(0.5);
            pdf.h2(entry.title);
            await pdf.markdown(entry.body);
            pdf.space();
        }

        pdf.space();
    }
    const buffer = pdf.finish();
    const response = new Response(buffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Length': `${buffer.length}`
        }
    });

    cacheResponse(url.href, auth.id, response.clone());
    return response as GenericResponse<Buffer>;
}) satisfies RequestHandler;
