import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getAuthFromCookies } from "../../../lib/security/getAuthFromCookies";

export const load: PageServerLoad = async ({ params, cookies }) => {
    const { key, id: userId } = await getAuthFromCookies(cookies);
    const id = params.labelId;
    if (!id) throw error(404, "Not found");

    return {};
};
