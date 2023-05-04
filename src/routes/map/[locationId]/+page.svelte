<script lang="ts">
    import EditLocation from '$lib/components/EditLocation.svelte';
    import Entries from '$lib/components/Entries.svelte';
    import type { Location } from '$lib/controllers/location';

    export let data: App.PageData & {
        location: Location;
    };
</script>

<section class="edit">
    <div>
        <EditLocation {...data.location} auth={data} />
    </div>
</section>

<section class="entries">
    <Entries
        auth={data}
        options={{
            locationId: data.location.id
        }}
        showLabels={true}
        showLocations={false}
        showSearch={true}
        hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
    />
</section>

<style lang="less">
    .entries {
        margin: 1rem;
    }

    .edit {
        margin: 2rem;
    }
</style>
