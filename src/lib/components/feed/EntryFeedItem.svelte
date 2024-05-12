<script lang="ts">
    import Entry from '$lib/components/entry/Entry.svelte';
    import FeedItemIcon from '$lib/components/feed/FeedItemIcon.svelte';
    import type { FeedItemTypes } from '$lib/controllers/feed/feed';
    import type { Location } from '$lib/controllers/location/location';

    export let entry: FeedItemTypes['entry'];

    export let obfuscated = true;
    export let showLabels = true;

    export let locations: Location[];
</script>

<FeedItemIcon type="entry" />

<!-- hack to remove 'type' attribute from entry -->
<Entry {...(({ type: _, ...rest }) => rest)(entry)} {obfuscated} {showLabels} {locations} />
