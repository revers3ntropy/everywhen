<script lang="ts">
    import { deviceDataFromEntry } from '$lib/utils/userAgent';
    import { tooltip } from '@svelte-plugins/tooltips';
    import Apple from 'svelte-material-icons/Apple.svelte';
    import Cellphone from 'svelte-material-icons/Cellphone.svelte';
    import Linux from 'svelte-material-icons/Linux.svelte';
    import Windows from 'svelte-material-icons/MicrosoftWindows.svelte';
    import Television from 'svelte-material-icons/Television.svelte';
    import Watch from 'svelte-material-icons/Watch.svelte';

    export let data = null as string | null;
    export let size: Pixels = 20;
    export let tooltipPosition = 'right' as TooltipPosition;

    const deviceData = deviceDataFromEntry({ agentData: data });
    let tooltipContent = `
        <span class="oneline">
            Created on ${deviceData.os || 'unknown device'}
        </span>
    `;
    if (deviceData.deviceSpecific || deviceData.device) {
        tooltipContent = `
            <span class="oneline">
                Created on ${deviceData.deviceSpecific || deviceData.device}
            </span>
            <span class="oneline">
                running ${deviceData.os || 'unknown device'}
            </span>
        `;
    }
    if (deviceData.browser) {
        tooltipContent += `
            <span class="oneline">
                with ${deviceData.browser} ${deviceData.browserVersion || ''}
            </span>
        `;
    }
</script>

{#if deviceData}
    <span
        use:tooltip={{
            content: tooltipContent,
            position: tooltipPosition
        }}
        class="flex-center"
    >
        {#if deviceData.osGroup === 'mobile'}
            <Cellphone {size} />
        {:else if deviceData.osGroup === 'watch'}
            <Watch {size} />
        {:else if deviceData.osGroup === 'tv'}
            <Television {size} />
        {:else if deviceData.osGroup === 'console'}
            <Television {size} />
        {:else if deviceData.osGroup === 'mac'}
            <Apple {size} />
        {:else if deviceData.osGroup === 'windows'}
            <Windows {size} />
        {:else if deviceData.osGroup === 'linux'}
            <Linux {size} />
        {:else}
            ?
        {/if}
    </span>
{/if}
