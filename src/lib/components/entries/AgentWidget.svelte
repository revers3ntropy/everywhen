<script lang="ts">
    import {
        consoleOSs,
        macOSs,
        mobileOSs,
        tvOSs,
        userAgentFromEntry,
        watchOSs,
        windowsOSs
    } from '$lib/utils/userAgent';
    import { tooltip } from '@svelte-plugins/tooltips';
    import { onMount } from 'svelte';
    import Apple from 'svelte-material-icons/Apple.svelte';
    import Cellphone from 'svelte-material-icons/Cellphone.svelte';
    import Linux from 'svelte-material-icons/Linux.svelte';
    import Windows from 'svelte-material-icons/MicrosoftWindows.svelte';
    import Television from 'svelte-material-icons/Television.svelte';
    import Watch from 'svelte-material-icons/Watch.svelte';
    import UAParser from 'ua-parser-js';
    import type { Pixels } from '../../../app';

    export let data = '';
    export let size: Pixels = 20;
    export let tooltipPosition = 'right';

    let ua = null as ReturnType<typeof UAParser> | null;

    onMount(() => {
        const userAgentString = userAgentFromEntry({ agentData: data });
        ua = new UAParser(userAgentString).getResult();
    });

    $: osName = ua !== null ? ua?.os?.name || 'Unknown OS' : '';
</script>

{#if ua}
    <span
        use:tooltip={{
            content: `Created on ${osName}`,
            position: tooltipPosition
        }}
    >
        {#if mobileOSs.includes(osName)}
            <Cellphone {size} />
        {:else if watchOSs.includes(osName)}
            <Watch {size} />
        {:else if tvOSs.includes(osName)}
            <Television {size} />
        {:else if consoleOSs.includes(osName)}
            <Television {size} />
        {:else if macOSs.includes(osName)}
            <Apple {size} />
        {:else if windowsOSs.includes(osName)}
            <Windows {size} />
        {:else}
            <Linux {size} />
        {/if}
    </span>
{/if}

<style lang="less">
    span {
        margin: 0.3rem;
    }
</style>
