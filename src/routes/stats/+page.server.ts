import type { PageServerLoad } from "./$types";
import { getAuthFromCookies } from "../../lib/security/getAuthFromCookies";
import { api } from "../../lib/api/apiQuery";
import type { Entry } from "../../lib/types";
import { wordCount as txtWordCount } from "../../lib/utils";

export const load: PageServerLoad = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const {
        entries,
        totalEntries
    } = await api.get(auth, "/entries") as unknown as {
        entries: Entry[],
        page: number,
        pageSize: number,
        totalPages: number,
        totalEntries: number
    };

    const entryText = entries.map(entry => entry.entry);

    const wordCount = txtWordCount(entryText.join(" "));
    const charCount = entryText.join("").length;

    return {
        entries,
        entryCount: totalEntries,
        wordCount,
        charCount
    };
};
