import type { RequestHandler } from "@sveltejs/kit";
import { getAuthFromCookies } from "../../../lib/security/getAuthFromCookies";
import { query } from "../../../lib/db/mysql";
import { decryptEntries } from "../entries/utils.server";
import type { RawEntry } from "../../../lib/types";
import { wordCount } from "../../../lib/utils";

export const GET: RequestHandler = async ({ cookies }) => {
	const auth = await getAuthFromCookies(cookies);

	let entries: any[] = await query<RawEntry[]>`
		SELECT id,
			   created,
			   title,
			   entry,
			   deleted,
			   label
		FROM entries
		WHERE deleted = false
		  AND user = ${ auth.id }
		ORDER BY created DESC, id
	`;

	entries = decryptEntries(entries, auth.key);
	entries = entries.map(e => ({
		id: e.id,
		created: e.created,
		title: e.title,
		wordCount: wordCount(e.entry)
	}));

	return new Response(JSON.stringify({
		entries
	}), { status: 200 });
};
