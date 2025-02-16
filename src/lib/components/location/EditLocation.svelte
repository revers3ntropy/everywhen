<script lang="ts">
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { tooltip } from '@svelte-plugins/tooltips';
    import Syncing from 'svelte-material-icons/CloudArrowUpOutline.svelte';
    import Synced from 'svelte-material-icons/CloudCheckOutline.svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import type { ChangeEventHandler } from 'svelte/elements';
    import { Location } from '$lib/controllers/location/location';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { roundToDecimalPlaces } from '$lib/utils/text';

    export let isInDialog = false;
    export let id: string;
    export let name: string;
    export let radius: number;
    export let created: number;
    export let latitude: number;
    export let longitude: number;

    export let onChange: ((location: Location | null) => Promise<void>) | null = null;

    let synced = true;

    $: radiusMeters = roundToDecimalPlaces(
        Location.degreesToMetersPrecise(radius, 1, 1, latitude)
    ).toString();

    async function syncWithServer() {
        synced = false;
        notify.onErr(
            await api.put(apiPath('/locations/?', id), {
                name,
                radius
            })
        );
        if (onChange !== null) {
            await onChange({ id, created, name, latitude, longitude, radius });
        }
        synced = true;
    }

    const onRadiusChange = (async () => {
        if (!radiusMeters) return;
        radius = Location.metersToDegreesPrecise(parseFloat(radiusMeters), 1, 1, latitude);
        await syncWithServer();
    }) satisfies ChangeEventHandler<HTMLInputElement>;

    async function bin() {
        if (!confirm(`Are you sure you want to delete the location '${name}'?`)) {
            return;
        }
        notify.onErr(await api.delete(apiPath('/locations/?', id)));
        popup.set(null);
        if (onChange !== null) {
            await onChange(null);
        }
    }
</script>

<div>
    {#if synced}
        <span
            use:tooltip={{
                content: 'Synced',
                position: 'right'
            }}
        >
            <Synced size="25" />
        </span>
    {:else}
        <span
            use:tooltip={{
                content: 'Syncing...',
                position: 'right'
            }}
        >
            <Syncing size="25" class="gradient-icon" />
        </span>
    {/if}

    {#if isInDialog}
        <button>
            <a class="flex-center" href="/map/{id}" style="padding: 4px"> See more </a>
        </button>
    {/if}
</div>
<div class="py-2">
    <Textbox bind:value={name} label="Name" on:change={syncWithServer} fullWidth thinBorder />
</div>
<div>
    <Textbox
        on:change={onRadiusChange}
        bind:value={radiusMeters}
        type="number"
        label="Radius"
        inputProps={{ min: 0, step: 0.1 }}
        endUnit="m"
        thinBorder
    />
</div>
<div class="py-4">
    <button
        class="with-icon border border-solid border-borderColor p-2 pr-3 danger rounded-xl md:m-0"
        on:click={bin}
    >
        <Bin size="25" />
        Delete
    </button>
</div>
