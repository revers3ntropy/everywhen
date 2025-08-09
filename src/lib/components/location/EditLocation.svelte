<script lang="ts">
    import Bin from 'svelte-material-icons/Delete.svelte';
    import ContentSaveOutline from 'svelte-material-icons/ContentSaveOutline.svelte';
    import { Button } from '$lib/components/ui/button';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import type { ChangeEventHandler } from 'svelte/elements';
    import { Location } from '$lib/controllers/location/location';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { roundToDecimalPlaces } from '$lib/utils/text';
    import { tryDecryptText, tryEncryptText } from '$lib/utils/encryption.client.js';

    export let isInDialog = false;
    export let id: string;
    export let name: string;
    export let radius: number;
    export let created: number;
    export let latitude: number;
    export let longitude: number;

    let oldRadius = radius;
    let oldName = name;

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
        oldRadius = radius;
        oldName = name;
    }

    const onRadiusChange = (async () => {
        if (!radiusMeters) return;
        if (parseFloat(radiusMeters) < 1) {
            radiusMeters = '1';
        }
        if (parseFloat(radiusMeters) > 10_000_000) {
            // Earth's circumference is 40k km
            radiusMeters = '10000000';
        }
        radius = Location.metersToDegreesPrecise(parseFloat(radiusMeters), 1, 1, latitude);
    }) satisfies ChangeEventHandler<HTMLInputElement>;

    async function bin() {
        const decryptedName = tryDecryptText(name);
        if (!confirm(`Are you sure you want to delete the location '${decryptedName}'?`)) {
            return;
        }
        notify.onErr(await api.delete(apiPath('/locations/?', id)));
        await dispatch.delete('location', id);
    }

    listen.location.onUpdate(l => {
        if (l.id !== id) return;
        radius = l.radius;
        latitude = l.latitude;
        longitude = l.longitude;
        name = l.name;
        created = l.created;
    });

    $: areChanges = name !== oldName || radius !== oldRadius;
</script>

<div>
    <div class="py-2">
        <Textbox
            value={tryDecryptText(name)}
            label="Name"
            onChange={plaintextName => {
                name = tryEncryptText(plaintextName);
            }}
            fullWidth
            thinBorder
        />
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
    <div class="">
        <div>
            {#if isInDialog}
                <button>
                    <a class="flex-center p-1" href="/map/{id}"> See more about location </a>
                </button>
            {/if}
        </div>

        <div class="py-4 flex justify-between items-center">
            <Button on:click={syncWithServer} class="gap-2" disabled={!areChanges}>
                <ContentSaveOutline size="25" />Save
            </Button>
            <Button on:click={bin} class="gap-2" variant="outline">
                <Bin size="25" />
                Delete
            </Button>
        </div>
    </div>
</div>
