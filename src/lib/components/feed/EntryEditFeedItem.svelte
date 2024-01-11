<script lang="ts">
    import { slide } from 'svelte/transition';
    import AgentWidget from '$lib/components/entry/AgentWidget.svelte';
    import TimeInFeed from '$lib/components/feed/TimeInFeed.svelte';
    import Lazy from '$lib/components/Lazy.svelte';
    import LocationWidget from '$lib/components/location/LocationWidget.svelte';
    import { ANIMATION_DURATION } from '$lib/constants';
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
            <LocationWidget {locations} {latitude} {longitude} {obfuscated} {showingMap} />
        </button>
    {/if}
    <div class="basis-full h-0 md:hidden"></div>

    <a class="flex gap-2 pl-2 md:pr-2 md:p-0" href="/journal#{entryId}" class:obfuscated>
        <ArrowDown size="20" />
        jump to
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
    </a>
</div>

{#if showingMap}
    <div transition:slide={{ duration: ANIMATION_DURATION, axis: 'y' }} class="p-1 md:p-4 md:pt-1">
        <i class="text-light text-sm pb-1">
            lat {latitude}, lng {longitude}
        </i>
        <Lazy
            shouldLoad={showingMap}
            key="$lib/components/map/Map.svelte"
            component={() => import('$lib/components/map/Map.svelte')}
            props={{
                entriesInteractable: false,
                roundedCorners: true,
                width: '100%',
                height: '300px',
                mobileHeight: '200px',
                entries: [
                    {
                        id,
                        created,
                        latitude,
                        longitude
                    }
                ]
            }}
        />
    </div>
{/if}
