import type { Entry } from '$lib/controllers/entry/entry';

interface EntrySearchResult extends Entry {
    type: 'entry';
}

export type SearchResults = EntrySearchResult[];
