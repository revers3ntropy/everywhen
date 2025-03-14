import type { Label } from '$lib/controllers/label/label';

interface LabelSearchResult extends Label {
    type: 'label';
}

export type SearchResults = LabelSearchResult[];
