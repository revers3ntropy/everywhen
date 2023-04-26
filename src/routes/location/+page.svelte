<script lang="ts">
    import Map from '../../lib/components/map/Map.svelte';
    import type { Entry } from '../../lib/controllers/entry';
    import type { Location } from '../../lib/controllers/location';

    export let data: App.PageData & {
        locations: Location[];
        entries: Entry[];
    };
</script>

<main>
    <section>
        <Map auth={data} entries={data.entries} locations={data.locations} />
    </section>
</main>
