import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getAuthFromCookies } from "../../../lib/security/getAuthFromCookies";
import { api } from "../../../lib/api/apiQuery";
import { GETArgs } from "../../../lib/utils";

export const load: PageServerLoad = async ({ params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    const labelId = params.labelId;
    if (!labelId) throw error(404, "Not found");

    const label = await api.get(auth, `/labels/${ labelId }`);
    const entries = await api.get(auth, `/entries${ GETArgs({ labelId }) }`);

    return {
        label,
        entryCount: entries.totalEntries
    };
};
