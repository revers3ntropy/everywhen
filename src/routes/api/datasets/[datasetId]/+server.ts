import { apiRes404 } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import type { RequestHandler } from './$types';
import { Dataset } from "$lib/controllers/dataset/dataset";
import { query } from "$lib/db/mysql.server";
import { error } from "@sveltejs/kit";

export const GET = cachedApiRoute(async (auth, { params }) => {
    const datasetId = params.datasetId;
    const { val, err } = await Dataset.fetchWholeDataset(query, auth, datasetId);
    if (err) throw error(400, err);
    return {
        rows: val,
    };
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
