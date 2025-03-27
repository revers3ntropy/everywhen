<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { dispatch } from '$lib/dataChangeEvents';
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

    const oldRadius = radius;
    const oldName = name;

    $: radiusMeters = roundToDecimalPlaces(
        Location.degreesToMetersPrecise(radius, 1, 1, latitude)
    ).toString();

    async function syncWithServer() {
        notify.onErr(
            await api.put(apiPath('/locations/?', id), {
                name,
                radius
            })
        );

        await dispatch.update(
            'location',
            { id, created, name, latitude, longitude, radius },
            { id, created, name: oldName, latitude, longitude, radius: oldRadius }
        );
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
        await dispatch.delete('location', id);
    }
</script>

<div>
    <div class="py-2">
        <Textbox bind:value={name} label="Name" onChange={syncWithServer} fullWidth thinBorder />
    </div>
    <div>
        <Textbox
            onChange={onRadiusChange}
            bind:value={radiusMeters}
            type="number"
            label="Radius"
            inputProps={{ min: 0, step: 0.1 }}
            endUnit="m"
            thinBorder
        />
    </div>
    <div class="flex items-center justify-between">
        <div>
            {#if isInDialog}
                <button>
                    <a class="flex-center p-1" href="/map/{id}"> See more about location </a>
                </button>
            {/if}
        </div>

        <div class="py-4">
            <Button on:click={bin} class="gap-2">
                <Bin size="25" />
                Delete
            </Button>
        </div>
    </div>
</div>
