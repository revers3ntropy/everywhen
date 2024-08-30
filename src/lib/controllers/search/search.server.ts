import type { Auth } from '$lib/controllers/auth/auth';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Label } from '$lib/controllers/label/label.server';
import type { SearchResults } from '$lib/controllers/search/search';
import { Result } from '$lib/utils/result';

namespace SearchServer {
    export async function search(auth: Auth, query: string): Promise<Result<SearchResults>> {
        const entries = await Entry.search(auth, query);
        if (!entries.ok) return entries.cast();

        const labelsMap = await Label.allWithCounts(auth);
        if (!labelsMap.ok) return labelsMap.cast();
        const labels = Object.entries(labelsMap.val)
            .map(([name, label]) => ({ ...label, name }))
            .filter(l => l.name.includes(query));

        return Result.ok([
            ...labels.map(l => ({ ...l, type: 'label' as const })),
            ...entries.val.map(e => ({ ...e, type: 'entry' as const }))
        ]);
    }
}

export const Search = {
    ...SearchServer
};

export type { SearchResults };
