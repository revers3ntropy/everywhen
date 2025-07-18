<script lang="ts">
    import Info from 'svelte-material-icons/InformationOutline.svelte';
    import Close from 'svelte-material-icons/Close.svelte';
    import { doesNotWantToEnableLocation, enabledLocation, settingsStore } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { nowUtc } from '$lib/utils/time';
    import { notify } from '$lib/components/notifications/notifications';

    async function enable() {
        const wasEnabled = $enabledLocation;
        $enabledLocation = true;

        if (!wasEnabled) {
            notify.success('Location enabled');
        }

        if ($settingsStore.preferLocationOn.value) return;
        // only ask this if showing the 'location not enabled' option
        // otherwise, the button asks to enable by default,
        // so don't check with user in that case.
        if (!wasEnabled) {
            if (
                !confirm(
                    'Also enable location by default? This can be changed at any time in settings.'
                )
            )
                return;
        }
        await api.put('/settings', {
            key: 'preferLocationOn',
            value: true
        });
        $settingsStore.preferLocationOn.value = true;
        $settingsStore.preferLocationOn.created = nowUtc();
        notify.success('Location enabled by default');
    }

    function close() {
        $doesNotWantToEnableLocation = true;
    }
</script>

{#if (!$enabledLocation || !$settingsStore.preferLocationOn.value) && !$doesNotWantToEnableLocation}
    <button on:click={enable} class="outer bottom-14 md:bottom-0 left-0 md:left-[192px] right-0">
        <span class="hide-mobile">
            <Info />
        </span>
        <span>
            {#if !$enabledLocation}
                Location is not enabled - click to enable location, so that future entries show up
                on this map
            {:else}
                Location is not enabled by default - click to enable by default (this can be changed
                any time in settings)
            {/if}
        </span>

        <button on:click={close} style="z-index: 2">
            <Close />
        </button>
    </button>
{/if}

<style lang="scss">
    button.outer {
        padding: 0.5rem 0;
        margin: 0;
        position: fixed;
        z-index: 1;
        background: var(--transluscent-bg);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
    }
</style>
