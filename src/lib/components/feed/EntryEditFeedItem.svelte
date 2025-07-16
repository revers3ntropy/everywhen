<script lang="ts">
    import FeedItemIcon from '$lib/components/feed/FeedItemIcon.svelte';
    import { slide } from 'svelte/transition';
    import AgentWidget from '$lib/components/entry/UserAgentWidget.svelte';
    import TimeInFeed from '$lib/components/feed/TimeInFeed.svelte';
    import Lazy from '$lib/components/ui/Lazy.svelte';
    import LocationWidget from '$lib/components/location/LocationWidget.svelte';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { Entry } from '$lib/controllers/entry/entry';
    import type { Location } from '$lib/controllers/location/location';
    import { settingsStore } from '$lib/stores';
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

<FeedItemIcon type="entry-edit" />

<div class="text-sm pt-2 pb-4 flex gap-2 flex-wrap">
    <TimeInFeed timestamp={created} tzOffset={createdTzOffset} />
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
        edited
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
        <div class="h-[200px] md:h-[300px]">
            <Lazy
                shouldLoad={showingMap}
                key="$lib/components/map/Mapbox.svelte"
                component={() => import('$lib/components/map/Mapbox.svelte')}
                props={{
                    entriesInteractable: false,
                    class: 'rounded-lg',
                    defaultCenter: { lat: latitude, lng: longitude },
                        defaultZoom: 15,
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
    </div>
{/if}
