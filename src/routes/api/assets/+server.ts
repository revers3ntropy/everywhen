import type { RequestHandler } from "@sveltejs/kit";
import { decode } from "fast-png";
import { getAuthFromCookies } from "../../../lib/security/getAuthFromCookies";

export const POST: RequestHandler = async ({ request, cookies }) => {
    const { key, id } = await getAuthFromCookies(cookies);

    const { data } = await request.json();
    const decoded = decode(data);

    console.log(data);

    return new Response(JSON.stringify({}), { status: 200 });
};