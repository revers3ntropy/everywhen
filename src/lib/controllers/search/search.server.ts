import type { Auth } from '$lib/controllers/auth/auth';
import { Label } from '$lib/controllers/label/label.server';
import type { SearchResults } from '$lib/controllers/search/search';
import { Result } from '$lib/utils/result';

namespace SearchServer {
    export async function search(auth: Auth, query: string): Promise<Result<SearchResults>> {
        const labels = await Label.search(auth, query);
        if (!labels.ok) return labels.cast();

        return Result.ok([...labels.val.map(l => ({ ...l, type: 'label' as const }))]);
    }
}

export const Search = {
    ...SearchServer
};

export type { SearchResults };
