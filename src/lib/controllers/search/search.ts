import type { LabelWithCount } from '$lib/controllers/label/label';

interface LabelSearchResult extends LabelWithCount {
    type: 'label';
}

export type SearchResults = LabelSearchResult[];
