<script lang="ts">
    import AgentWidget from '$lib/components/entry/AgentWidget.svelte';
    import TimeInFeed from '$lib/components/feed/TimeInFeed.svelte';
    import LocationWidget from '$lib/components/location/LocationWidget.svelte';
    import { Entry } from '$lib/controllers/entry/entry';
    import type { Location } from '$lib/controllers/location/location';
    import { settingsStore } from '$lib/stores';
    import NoteEditOutline from 'svelte-material-icons/NoteEditOutline.svelte';
    import ArrowDown from 'svelte-material-icons/ArrowDown.svelte';

    export let id: string;
    export let entryId: string;
    export let created: number;
    export let createdTzOffset: number;
    export let latitude: number | null;
    export let longitude: number | null;
    export let agentData: string;
    export let titleShortened: string;
    export let bodyShortened: string;

    export let obfuscated: boolean;

    export let locations: Location[];

    let showingMap = false;
</script>

<div class="text-sm py-2 flex gap-y-2 gap-x-2 flex-wrap">
    <TimeInFeed timestamp={created} tzOffset={createdTzOffset} />
    <NoteEditOutline size="24" />
    {#if $settingsStore.showAgentWidgetOnEntries.value}
        <AgentWidget data={agentData} />
    {/if}
    {#if latitude && longitude}
        <button on:click={() => (showingMap = !showingMap)} aria-label="Expand map">
            <LocationWidget {locations} entryId={id} {latitude} {longitude} {obfuscated} />
        </button>
    {/if}
    <div class="basis-full h-0 md:hidden"></div>

    <a class="flex gap-2 pl-2 md:pr-2 md:p-0" href="/journal#{entryId}" class:obfuscated>
        <span class="text-light pr-2">
            {#if titleShortened}
                {titleShortened}
            {:else}
                <i>
                    {bodyShortened}{#if bodyShortened.length >= Entry.TITLE_LENGTH_CUTOFF}...
                    {/if}
                </i>
            {/if}
        </span>
        <ArrowDown size="20" />
        jump to entry
    </a>
</div>
