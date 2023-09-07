<script lang="ts">
    import Info from 'svelte-material-icons/InformationOutline.svelte';
    import { tooltip } from '@svelte-plugins/tooltips';
    import Close from 'svelte-material-icons/Close.svelte';
    import { doesNotWantToEnableLocation, enabledLocation, settingsStore } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { nowUtc } from '$lib/utils/time';

    async function enable() {
        const wasEnabled = $enabledLocation;
        $enabledLocation = true;

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
    }

    function close() {
        $doesNotWantToEnableLocation = true;
    }
</script>

{#if (!$enabledLocation || !$settingsStore.preferLocationOn.value) && !$doesNotWantToEnableLocation}
    <button on:click={enable} class="outer">
        <Info />
        <span>
            {#if !$enabledLocation}
                Location is not enabled - click to enable location, so that future entries show up
                on this map
            {:else}
                Location is not enabled by default - click to enable by default (this can be changed
                any time in settings)
            {/if}
        </span>

        <button
            use:tooltip={{
                content: `<span class="oneline"> Don't show again </span>`,
                position: 'bottom'
            }}
            on:click={close}
            style="z-index: 2"
        >
            <Close />
        </button>
    </button>
{/if}

<style lang="scss">
    @import '../../../styles/variables';

    button.outer {
        width: calc(100% - 2rem);
        padding: 0.5rem 0;
        margin: 0;
        position: fixed;
        z-index: 1;
        background: var(--transluscent-bg);
        border-radius: $border-radius $border-radius 0 0;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
    }
</style>
