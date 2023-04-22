<script lang="ts">
    // @ts-ignore
    import { tooltip } from '@svelte-plugins/tooltips';
    import Syncing from 'svelte-material-icons/CloudArrowUpOutline.svelte';
    import Synced from 'svelte-material-icons/CloudCheckOutline.svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { ChangeEventHandler } from 'svelte/elements';
    import { Location } from '../controllers/location';
    import type { Auth } from '../controllers/user';
    import { popup } from '../stores';
    import { api, apiPath } from '../utils/apiRequest';
    import { displayNotifOnErr } from '../utils/notifications';
    import { round1DP } from '../utils/text';

    const { addNotification } = getNotificationsContext();

    export let isInDialog = false;
    export let auth: Auth;
    export let id: string;
    export let name: string;
    export let radius: number;
    export let created: number;
    export let createdTZOffset: number;
    export let latitude: number;
    export let longitude: number;

    export let onChange = async (_location: Location | null) => void 0;

    let synced = true;

    async function syncWithServer () {
        synced = false;
        displayNotifOnErr(
            addNotification,
            await api.put(auth, apiPath('/locations/?', id), {
                name,
                radius,
            }),
        );
        await onChange(new Location(
            id,
            created,
            createdTZOffset,
            name,
            latitude,
            longitude,
            radius,
        ));
        synced = true;
    }

    const onRadiusChange = (async ({ target }) => {
        if (!target || !('value' in target) || typeof target.value !== 'string') {
            throw target;
        }
        radius = Location.metersToDegrees(parseFloat(target.value));
        await syncWithServer();
    }) satisfies ChangeEventHandler<HTMLInputElement>;

    async function bin () {
        displayNotifOnErr(
            addNotification,
            await api.delete(auth, apiPath('/locations/?', id)),
        );
        popup.set(null);
        await onChange(null);
    }
</script>

<div>
    <div class="nav">
        {#if synced}
            <span use:tooltip={{
                content: 'Synced',
                position: 'right'
            }}>
                <Synced size="25" />
            </span>
        {:else}
            <span use:tooltip={{
                content: 'Syncing...',
                position: 'right'
            }}>
                <Syncing size="25" />
            </span>
        {/if}

        {#if isInDialog}
            <button>
                <a class="flex-center" href="/location/{id}">
                    See more
                </a>
            </button>
        {/if}
        <button
            on:click={bin}
            use:tooltip={{
                content: 'Delete',
                 position: 'bottom'
            }}>
            <Bin size="25" />
        </button>
    </div>
    <h2>
        <label>
            <input
                bind:value={name}
                on:change={syncWithServer}
            >
        </label>
    </h2>
    <label>
        <span class="text-light">Radius</span><br>
        <input
            min="0"
            on:change={onRadiusChange}
            step="0.1"
            type="number"
            value={round1DP(Location.degreesToMeters(radius))}
        >
        m
    </label>
</div>

<style lang="less">
    .nav {
        position: relative;
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }
</style>