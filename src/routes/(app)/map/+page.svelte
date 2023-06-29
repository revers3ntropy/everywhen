<script lang="ts">
    import Map from '$lib/components/map/Map.svelte';
    import type { PageData } from './$types';

    export let data: PageData;
</script>

<main>
    <section>
        <Map
            auth={data.auth}
            entries={data.entries}
            locations={data.locations}
            hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
        />
    </section>
</main>
