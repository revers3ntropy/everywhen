<script lang="ts">
    import Apple from 'svelte-material-icons/Apple.svelte';
    import Cellphone from 'svelte-material-icons/Cellphone.svelte';
    import Linux from 'svelte-material-icons/Linux.svelte';
    import Windows from 'svelte-material-icons/MicrosoftWindows.svelte';
    import Television from 'svelte-material-icons/Television.svelte';
    import Watch from 'svelte-material-icons/Watch.svelte';
    import * as Tooltip from '$lib/components/ui/tooltip';
    import { deviceDataFromEntry } from '$lib/utils/userAgent';
    import type { Pixels } from '../../../types';

    export let data = null as string | null;
    export let size: Pixels = 20;

    $: deviceData = deviceDataFromEntry({ agentData: data });
</script>

{#if deviceData}
    <Tooltip.Root>
        <Tooltip.Trigger class="flex-center">
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
        </Tooltip.Trigger>
        <Tooltip.Content>
            {#if deviceData.deviceSpecific || deviceData.device}
                <p class="oneline">
                    Created on {deviceData.deviceSpecific || deviceData.device}
                    running {deviceData.os || 'unknown device'}
                </p>
            {:else}
                <p class="oneline">
                    Created on {deviceData.os || 'unknown device'}
                </p>
            {/if}

            {#if deviceData.browser}
                <span class="oneline">
                    with {deviceData.browser}
                    {deviceData.browserVersion || ''}
                </span>
            {/if}
        </Tooltip.Content>
    </Tooltip.Root>
{/if}
