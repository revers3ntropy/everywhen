import type { Entry } from '$lib/controllers/entry/entry';
import type { LabelWithCount } from '$lib/controllers/label/label';

interface EntrySearchResult extends Entry {
    type: 'entry';
}

interface LabelSearchResult extends LabelWithCount {
    type: 'label';
}

export type SearchResults = (EntrySearchResult | LabelSearchResult)[];
