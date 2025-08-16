<script lang="ts">
    import Apple from 'svelte-material-icons/Apple.svelte';
    import Cellphone from 'svelte-material-icons/Cellphone.svelte';
    import Linux from 'svelte-material-icons/Linux.svelte';
    import Windows from 'svelte-material-icons/MicrosoftWindows.svelte';
    import Television from 'svelte-material-icons/Television.svelte';
    import Watch from 'svelte-material-icons/Watch.svelte';
    import { PopoverTrigger, Popover, PopoverContent } from '$lib/components/ui/popover';
    import { deviceDataFromEntry } from '$lib/utils/userAgent';
    import type { Pixels } from '../../../types';

    export let data = null as string | null;
    export let size: Pixels = 20;

    $: deviceData = deviceDataFromEntry({ agentData: data });
</script>

{#if deviceData}
    <Popover>
        <PopoverTrigger
            class="flex-center rounded-full p-0 aspect-square w-[30px] h-[30px] bg-vLightAccent hover:bg-lightAccent"
            aria-label="user agent widget"
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
        </PopoverTrigger>
        <PopoverContent class="w-fit">
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
        </PopoverContent>
    </Popover>
{/if}
