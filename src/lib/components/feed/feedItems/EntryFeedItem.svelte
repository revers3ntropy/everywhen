<script lang="ts">
    import Entry from '$lib/components/entry/Entry.svelte';
    import type { FeedItemTypes } from '$lib/controllers/feed/feed';
    import type { Label } from '$lib/controllers/label/label';
    import type { Location } from '$lib/controllers/location/location';
    import { omit } from '$lib/utils';

    export let entry: FeedItemTypes['entry'];

    export let obfuscated = true;
    export let showLabels = true;

    export let locations: Location[];
    export let labels: Record<string, Label>;
</script>

<Entry {...omit(entry, 'type')} {obfuscated} {showLabels} {locations} {labels} />
