<script lang="ts" context="module">
    import { writable } from 'svelte/store';
    import type { Writable } from 'svelte/store';

    // 'empty' if collapsed by default as there are no entries for this day
    let collapsed: Writable<Record<string, boolean | 'empty' | undefined>> = writable({});
</script>

<script lang="ts">
    import { onMount } from 'svelte';
    import { fly, slide } from 'svelte/transition';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import EntryForm from '$lib/components/entryForm/EntryForm.svelte';
    import EntryEditFeedItem from '$lib/components/feed/feedItems/EntryEditFeedItem.svelte';
    import EntryFeedItem from '$lib/components/feed/feedItems/EntryFeedItem.svelte';
    import EventEndFeedItem from '$lib/components/feed/feedItems/EventEndFeedItem.svelte';
    import EventStartFeedItem from '$lib/components/feed/feedItems/EventStartFeedItem.svelte';
    import HappinessFeedItem from '$lib/components/feed/feedItems/HappinessFeedItem.svelte';
    import SleepFeedItem from '$lib/components/feed/feedItems/SleepFeedItem.svelte';
    import LocationsWithWeather from '$lib/components/location/LocationsWithWeather.svelte';
    import type { Entry } from '$lib/controllers/entry/entry';
    import { Feed } from '$lib/controllers/feed/feed';
    import type { Label } from '$lib/controllers/label/label';
    import { omit } from '$lib/utils';
    import { Day } from '$lib/utils/day';
    import { ANIMATION_DURATION } from '$lib/constants';
    import type { Location } from '$lib/controllers/location/location';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import Dot from '../ui/Dot.svelte';
    import UtcTime from '../ui/UtcTime.svelte';
    import type { FeedDay } from '$lib/controllers/feed/feed';
    import HappinessDatasetShortcut from '$lib/components/dataset/HappinessDatasetShortcut.svelte';
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import type { OpenWeatherMapAPI } from '$lib/controllers/openWeatherMapAPI/openWeatherMapAPI';
    import OtherDatasetFeemItem from '$lib/components/feed/feedItems/OtherDatasetFeemItem.svelte';

    export let locations: Location[];
    export let labels: Record<string, Label>;
    export let obfuscated: boolean;
    export let day: FeedDay;
    export let showLabels = true;
    export let showForms = false;
    export let happinessDataset: Dataset | null = null;
    export let getWeather: (location: Location) => Promise<OpenWeatherMapAPI.WeatherForDay | null>;

    function toggleCollapse() {
        $collapsed[day.day] = !$collapsed[day.day];
    }

    $: items = Feed.orderedFeedItems(day.items);
    $: entryCount = items?.filter(item => item.type === 'entry').length ?? 0;
    $: isToday = Day.todayUsingNativeDate().fmtIso() === day.day;
    $: dayTimestamp = new Date(day.day).getTime() / 1000;
    $: monthsAgo = Day.fromString(day.day).unwrap().monthsAgo();
    $: if ((items?.length > 0 || (isToday && showForms)) && $collapsed[day.day] == 'empty') {
        $collapsed[day.day] = false;
    }
    $: entriesWithLocation = items?.filter(
        // filter out all entries with locations
        (item): item is { type: 'entry' } & Entry & { latitude: number; longitude: number } =>
            item.type === 'entry' && item.latitude !== null && item.longitude !== null
    );

    onMount(() => {
        if (items?.length < 1 && (!isToday || !showForms)) {
            $collapsed[day.day] = 'empty';
        }
    });
</script>

<div class="pb-4 w-full">
    <!-- only round top right on 'today' as the entry form always appears directly below -->
    <div class="bg-lightAccent p-2 rounded-r-xl" class:mb-2={!isToday && !$collapsed[day.day]}>
        <div class="flex justify-between">
            <div class="flex overflow-x-auto no-scrollbar">
                <button class="flex-center" on:click={toggleCollapse}>
                    {#if $collapsed[day.day]}
                        <ChevronDown size="25" />
                    {:else}
                        <ChevronUp size="25" />
                    {/if}

                    {#if isToday}
                        <span>Today</span>
                    {:else if fmtUtc(nowUtc() - 60 * 60 * 24, currentTzOffset(), 'YYYY-MM-DD') === day.day}
                        <span>Yesterday</span>
                    {:else}
                        <UtcTime
                            fmt="ddd, Do MMMM{monthsAgo < 8 ? '' : ' YYYY'}"
                            noTooltip
                            timestamp={dayTimestamp}
                            tzOffset={0}
                        />

                        {#if monthsAgo < 13}
                            <Dot light marginX={10} />
                            <span class="text-light">
                                <UtcTime relative timestamp={dayTimestamp} tzOffset={0} />
                            </span>
                        {/if}
                    {/if}
                </button>

                {#if entriesWithLocation.length}
                    <span class="pl-2">
                        <LocationsWithWeather
                            {obfuscated}
                            {locations}
                            latitudes={entriesWithLocation.map(e => e.latitude)}
                            longitudes={entriesWithLocation.map(e => e.longitude)}
                            dayOfWeather={Day.fromString(day.day).unwrap()}
                            {getWeather}
                        />
                    </span>
                {/if}

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
                        <p class="text-textColorLight">
                            {entryCount}
                            {entryCount === 1 ? 'entry' : 'entries'}
                        </p>
                    </div>
                {/if}
            </div>
            <div class="flex-center gap-4">
                {#if isToday && showForms}
                    <HappinessDatasetShortcut dataset={happinessDataset} />
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
                <div class="bg-vLightAccent rounded-r-xl pt-2">
                    <EntryForm {obfuscated} {labels} />
                </div>
            {/if}
            <div class="w-full">
                {#each items || [] as item, i (item.id)}
                    {#if item.type === 'entry'}
                        <div class="relative">
                            <span
                                class="hide-mobile flex-center rounded-full absolute top-[16px] -left-[9px] bg-border w-4 h-4"
                            />
                        </div>
                        <EntryFeedItem
                            entry={item}
                            {obfuscated}
                            {showLabels}
                            {locations}
                            {labels}
                        />
                    {:else if item.type === 'entry-edit'}
                        <EntryEditFeedItem {...omit(item, 'type')} {locations} {obfuscated} />
                    {:else if item.type === 'sleep'}
                        <SleepFeedItem
                            tzOffset={item.startTzOffset}
                            start={item.start}
                            duration={item.duration}
                            quality={item.quality}
                            regularity={item.regularity}
                            asleepAfter={item.asleepAfter}
                            timeAsleep={item.timeAsleep}
                            {obfuscated}
                        />
                    {:else if item.type === 'event-start'}
                        <EventStartFeedItem
                            {labels}
                            {item}
                            nextItem={items[i - 1] ?? null}
                            {obfuscated}
                        />
                    {:else if item.type === 'event-end'}
                        <EventEndFeedItem
                            {labels}
                            {item}
                            previousItem={items[i + 1] ?? null}
                            {obfuscated}
                        />
                    {:else if item.type === 'happiness'}
                        <HappinessFeedItem
                            {obfuscated}
                            timestamp={item.timestamp}
                            tzOffset={item.timestampTzOffset}
                            value={item.value}
                        />
                    {:else if item.type === 'otherDataset'}
                        <OtherDatasetFeemItem
                            {obfuscated}
                            timestamp={item.timestamp}
                            tzOffset={item.timestampTzOffset}
                            rowJson={item.rowJson}
                            datasetId={item.datasetId}
                            datasetName={item.datasetName}
                            columns={item.columns}
                        />
                    {/if}
                {/each}
            </div>
        </div>
    {/if}
</div>
