import { Entry } from '../../../lib/controllers/entry';
import { Label } from '../../../lib/controllers/label';
import { getUnwrappedReqBody, nowS } from '../../../lib/utils';
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';

export const GET: RequestHandler = async ({ url, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const page = parseInt(url.searchParams.get('page') || '0');
    const deleted = url.searchParams.get('deleted') === '1';
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const labelId = url.searchParams.get('labelId') || undefined;
    if (page < 0) throw error(400, 'Invalid page number');
    if (!pageSize || pageSize < 0) throw error(400, 'Invalid page size');

    const { val, err } = await Entry.getPage(
        auth, page, pageSize, { deleted, labelId, search });
    if (err) throw error(400, err);
    const [ entries, numEntries ] = val;

    const response = {
        entries,
        page,
        pageSize,
        totalPages: Math.ceil(numEntries / pageSize),
        totalEntries: numEntries,
    };

    return new Response(JSON.stringify(response), { status: 200 });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const body = await getUnwrappedReqBody(request, {
        created: 'number',
        latitude: 'number',
        longitude: 'number',
        title: 'string',
        entry: 'string',
        label: 'string',
    }, {
        title: '',
        label: '',
        latitude: 0,
        longitude: 0,
        created: nowS(),
    });

    // check label exists
    if (body.label) {
        if (!await Label.userHasLabelWithId(auth, body.label)) {
            throw error(400, `Label doesn't exist`);
        }
    }

    const { val: id, err } = await Entry.create(auth, body);
    if (err) throw error(400, err);

    return new Response(
        JSON.stringify({ id }),
        { status: 201 },
    );
};
