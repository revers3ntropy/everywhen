<script lang="ts" context="module">
    import { writable } from 'svelte/store';
    import type { Writable } from 'svelte/store';

    // 'empty' if collapsed by default as there are no entries for this day
    let collapsed: Writable<Record<string, boolean | 'empty' | undefined>> = writable({});
</script>

<script lang="ts">
    import EntryForm from '$lib/components/entryForm/EntryForm.svelte';
    import EventEndFeedItem from '$lib/components/feed/EventEndFeedItem.svelte';
    import EventStartFeedItem from '$lib/components/feed/EventStartFeedItem.svelte';
    import SleepInfo from '$lib/components/feed/SleepCycleFeedItem.svelte';
    import { Feed } from '$lib/controllers/feed/feed';
    import { currentlyUploadingEntries } from '$lib/stores';
    import { fly, slide } from 'svelte/transition';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { listen } from '$lib/dataChangeEvents';
    import Entry from '$lib/components/entry/Entry.svelte';
    import type { Location } from '$lib/controllers/location/location';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import Dot from '../Dot.svelte';
    import UtcTime from '../UtcTime.svelte';
    import type { FeedDay } from '$lib/controllers/feed/feed';
    import { onMount } from 'svelte';
    import HappinessDatasetShortcut from '$lib/components/dataset/HappinessDatasetShortcut.svelte';
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import HappinessValueIcon from '$lib/components/dataset/HappinessValueIcon.svelte';

    export let locations: Location[];
    export let obfuscated = true;
    export let day: FeedDay;
    export let showLabels = true;
    export let showForms = false;
    export let happinessDataset: Dataset | null = null;

    function toggleCollapse() {
        $collapsed[day.day] = !$collapsed[day.day];
    }

    $: items = day?.items;
    $: isToday = fmtUtc(nowUtc(), currentTzOffset(), 'YYYY-MM-DD') === day.day;
    $: dayTimestamp = new Date(day.day).getTime() / 1000;

    $: if (items?.length > 0 && $collapsed[day.day] == 'empty') {
        $collapsed[day.day] = false;
    }

    onMount(() => {
        if (items?.length < 1 && (!isToday || !showForms)) {
            $collapsed[day.day] = 'empty';
        }
    });

    listen.entry.onCreate(({ entry }) => {
        if (!isToday) return;
        items = Feed.orderedFeedItems([...items, { ...entry, type: 'entry' }]);
    });
    listen.entry.onDelete(id => {
        items = items?.filter(entry => entry.id !== id);
    });
    listen.entry.onUpdate(entry => {
        // only update if the entry is in this group
        const i = items?.findIndex(e => e.id === entry.id);
        if (i !== -1) {
            items[i] = { ...entry, type: 'entry' };
        }
    });
</script>

<div class="entry-group">
    <div class="title">
        <div class="flex justify-between">
            <div>
                <button class="flex-center" on:click={toggleCollapse}>
                    {#if $collapsed[day.day]}
                        <ChevronDown size="25" />
                    {:else}
                        <ChevronUp size="25" />
                    {/if}

                    <UtcTime
                        fmt="ddd, Do MMMM YYYY"
                        noTooltip
                        timestamp={dayTimestamp}
                        tzOffset={0}
                    />

                    <Dot light marginX={10} />

                    <span class="text-light">
                        {#if isToday}
                            <span>Today</span>
                        {:else if fmtUtc(nowUtc() - 60 * 60 * 24, currentTzOffset(), 'YYYY-MM-DD') === day.day}
                            <span>Yesterday</span>
                        {:else}
                            <UtcTime relative timestamp={dayTimestamp} tzOffset={0} />
                        {/if}
                    </span>

                    {#if $collapsed[day.day]}
                        <div
                            transition:fly|local={{
                                // local transition to avoid affecting other groups
                                x: -50,
                                duration: ANIMATION_DURATION
                            }}
                            class="flex-center hide-mobile"
                        >
                            <Dot light marginX={10} />
                            <p class="entry-count">
                                {items?.length}
                                {items?.length === 1 ? 'entry' : 'entries'}
                            </p>
                        </div>
                    {/if}
                </button>
            </div>
            <div>
                {#if isToday && showForms}
                    <HappinessDatasetShortcut
                        dataset={happinessDataset}
                        buttonValue={day.happiness}
                    />
                {:else if day.happiness !== null}
                    <!-- show on 'today' when forms are hidden,
                         and every other day which has a score -->
                    <HappinessValueIcon value={day.happiness} />
                {/if}
            </div>
        </div>
    </div>
    {#if !$collapsed[day.day]}
        <div
            transition:slide|local={{
                axis: 'y',
                duration: ANIMATION_DURATION
            }}
        >
            {#if showForms && isToday}
                <EntryForm {obfuscated} />
            {/if}
            <div class="contents">
                {#if isToday && $currentlyUploadingEntries}
                    {#each { length: $currentlyUploadingEntries } as i (i)}
                        <Entry
                            id="temp-{i}"
                            title=""
                            body="..."
                            created={nowUtc()}
                            createdTzOffset={currentTzOffset()}
                            label={null}
                            latitude={null}
                            longitude={null}
                            deleted={null}
                            pinned={null}
                            wordCount={-1}
                            agentData=""
                            edits={[]}
                            {obfuscated}
                            {showLabels}
                            {locations}
                        />
                    {/each}
                {/if}
                {#each items || [] as item, i (item.id)}
                    {#if item.type === 'entry'}
                        <!-- hack to remove 'type' attribute from entry -->
                        <Entry
                            {...(({ type: _, ...rest }) => rest)(item)}
                            {obfuscated}
                            {showLabels}
                            {locations}
                        />
                    {:else if item.type === 'sleep'}
                        <SleepInfo
                            tzOffset={item.startTzOffset}
                            start={item.start}
                            duration={item.duration}
                            quality={item.quality}
                            regularity={item.regularity}
                        />
                    {:else if item.type === 'event-start'}
                        <EventStartFeedItem {item} nextItem={items[i + 1] ?? null} />
                    {:else if item.type === 'event-end'}
                        <EventEndFeedItem {item} previousItem={items[i - 1] ?? null} />
                    {/if}
                {/each}
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    @import '$lib/styles/layout';

    .entry-group {
        width: 100%;
        margin: 0;
        padding: 0;

        transition: height #{$transition};

        @media #{$not-mobile} {
            border-radius: $border-radius;
            background: var(--v-light-accent);
            margin: 1rem 0;
            padding: 7px 0;

            &:first-child {
                margin-top: 0;
            }
            &:last-child {
                margin-bottom: 0;
            }
        }

        .title {
            padding: 0.4rem 0.8rem;

            @media #{$mobile} {
                border-radius: $border-radius;
                background: var(--v-light-accent);
                border: 1px solid var(--border-color);
                margin: 0.5rem 0;
                padding: 0.4rem 0.8rem 0.4rem 0;
                position: sticky;
                top: 55px;
                z-index: 4;
            }

            .entry-count {
                font-size: 1rem;
                color: var(--text-color-light);
            }
        }

        @media #{$mobile} {
            margin: 0;
            border: none;
            border-radius: 0;
        }

        .contents {
            padding: 0 0 1em 0;
        }
    }
</style>
