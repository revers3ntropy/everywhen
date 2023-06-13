<script lang="ts">
    import { goto } from '$app/navigation';
    import EditLocation from '$lib/components/location/EditLocation.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import type { Location } from '$lib/controllers/location';
    import type { PageData } from './$types';

    export let data: PageData;

    async function onChange(newLocation: Location | null): Promise<void> {
        if (newLocation === null) {
            await goto('/map');
        }
    }
</script>

<section class="edit">
    <div>
        <EditLocation {...data.location} auth={data} {onChange} />
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
    @import '../../../styles/variables';

    .entries {
        margin: 1rem;
    }

    .edit {
        margin: 2rem;

        @media @mobile {
            margin: 2px;
        }
    }
</style>
