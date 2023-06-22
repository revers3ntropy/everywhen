<script lang="ts">
    import { tooltip } from '@svelte-plugins/tooltips';
    import Syncing from 'svelte-material-icons/CloudArrowUpOutline.svelte';
    import Synced from 'svelte-material-icons/CloudCheckOutline.svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import type { ChangeEventHandler } from 'svelte/elements';
    import { Location } from '$lib/controllers/location';
    import type { Auth } from '$lib/controllers/user';
    import { popup } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/notifications/notifications';
    import { round1DP } from '$lib/utils/text';

    export let isInDialog = false;
    export let auth: Auth;
    export let id: string;
    export let name: string;
    export let radius: number;
    export let created: number;
    export let createdTZOffset: number;
    export let latitude: number;
    export let longitude: number;

    export let onChange: ((location: Location | null) => Promise<void>) | null =
        null;

    let synced = true;

    async function syncWithServer() {
        synced = false;
        displayNotifOnErr(
            await api.put(auth, apiPath('/locations/?', id), {
                name,
                radius
            })
        );
        if (onChange !== null) {
            await onChange(
                new Location(
                    id,
                    created,
                    createdTZOffset,
                    name,
                    latitude,
                    longitude,
                    radius
                )
            );
        }
        synced = true;
    }

    const onRadiusChange = (async ({ target }) => {
        if (
            !target ||
            !('value' in target) ||
            typeof target.value !== 'string'
        ) {
            throw target;
        }
        radius = Location.metersToDegreesPrecise(
            parseFloat(target.value),
            1,
            1,
            latitude
        );
        await syncWithServer();
    }) satisfies ChangeEventHandler<HTMLInputElement>;

    async function bin() {
        if (
            !confirm(`Are you sure you want to delete the location '${name}'?`)
        ) {
            return;
        }
        displayNotifOnErr(await api.delete(auth, apiPath('/locations/?', id)));
        popup.set(null);
        if (onChange !== null) {
            await onChange(null);
        }
    }
</script>

<div>
    <div class="nav">
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
                <a class="flex-center" href="/map/{id}" style="padding: 4px">
                    See more
                </a>
            </button>
        {/if}
    </div>
    <h2 style="margin: 1rem 0;">
        <label>
            <input bind:value={name} on:change={syncWithServer} />
        </label>
    </h2>
    <label>
        <span class="text-light">Radius</span>
        <input
            min="0"
            on:change={onRadiusChange}
            step="0.1"
            type="number"
            value={round1DP(
                Location.degreesToMetersPrecise(radius, 1, 1, latitude)
            )}
            style="width: 100px"
        />
        m
    </label>
    <div>
        <button class="with-icon bordered danger" on:click={bin}>
            <Bin size="25" />
            Delete
        </button>
    </div>
</div>

<style lang="less">
    .nav {
        position: relative;
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    input {
        max-width: 100%;
    }
</style>
