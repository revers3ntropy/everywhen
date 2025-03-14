import type { Auth } from '$lib/controllers/auth/auth';
import type { SearchResults } from '$lib/controllers/search/search';
import { Result } from '$lib/utils/result';

namespace SearchServer {
    export async function search(_auth: Auth, _query: string): Promise<Result<SearchResults>> {
        return Result.ok([]);
    }
}

export const Search = {
    ...SearchServer
};

export type { SearchResults };
