<script lang="ts">
    import { browser } from '$app/environment';
    import type { Label } from '$lib/controllers/label/label';
    import { inview } from 'svelte-inview';
    import { obfuscated } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import { notify } from '$lib/components/notifications/notifications';
    import { Entry, type EntryFilter } from '$lib/controllers/entry/entry';
    import type { Location } from '$lib/controllers/location/location';
    import type { Mutable } from '../../../types';
    import Spinner from '../ui/BookSpinner.svelte';
    import DayInFeed from '$lib/components/feed/DayInFeed.svelte';

    interface IOptions extends EntryFilter {
        readonly count?: number;
        readonly offset?: number;
    }

    export let locations: Location[];
    export let labels: Record<string, Label>;
    export let showLabels = true;
    export let showForms = false;
    export let numberOfEntries = Infinity;
    export let options: IOptions = {};

    function getEntriesOptions(): IOptions {
        const entriesOptions = {
            ...(options as Mutable<IOptions>),
            offset: currentOffset,
            count: batchSize
        };

        if (!entriesOptions.search) {
            delete entriesOptions.search;
        }

        return Object.freeze(entriesOptions);
    }

    async function reloadEntries() {
        currentOffset = 0;
        loadingAt = null;
        entries = emptyEntries();
        numberOfEntries = Infinity;

        await loadMoreEntries(true);
    }

    async function loadMoreEntries(isInitialLoad = false) {
        pageEndInView = true;
        let offset = currentOffset;
        if (loadingAt === offset && !isInitialLoad) {
            return;
        }
        loadingAt = offset;

        if (loadingAt >= numberOfEntries) {
            return;
        }

        const entriesOptions = getEntriesOptions();

        const res = notify.onErr(
            await api.get(`/entries`, entriesOptions as Record<string, string | number>)
        );

        numberOfEntries = res.totalEntries;

        currentOffset += res.entries.length;
        entries = ensureNoDuplicateEntries(Entry.groupEntriesByDay(res.entries, entries));

        // if still loading at this offset, so another req has not been sent,
        // say we have stopped loading
        if (loadingAt === offset) {
            loadingAt = null;
        }

        if (pageEndInView) {
            void loadMoreEntries();
        }
    }

    function ensureNoDuplicateEntries(entries: Record<string, Entry[]>): Record<string, Entry[]> {
        // Very occasionally, the same entries are loaded twice by accident,
        // so filter out duplicates. TODO make it so they are never loaded twice
        for (const day in entries) {
            entries[day] = entries[day].filter(
                (entry, i, arr) => arr.findIndex(e => e.id === entry.id) === i
            );
        }
        return entries;
    }

    function emptyEntries(): Record<string, Entry[]> {
        return {
            [fmtUtc(nowUtc(), currentTzOffset(), 'YYYY-MM-DD')]: []
        };
    }

    const batchSize = 10;
    let pageEndInView = false;
    let entries = emptyEntries();
    let currentOffset = 0;
    let loadingAt = null as number | null;

    $: if (options.search !== undefined && browser) void reloadEntries();
    $: sortedEntryKeys = Object.keys(entries).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    // make sure that there is always 'today' for the entry form
    $: entries[fmtUtc(nowUtc(), currentTzOffset(), 'YYYY-MM-DD')] ??= [];
</script>

<div class="w-full md:max-w-3xl">
    <div class="md:border md:border-borderColor">
        {#each sortedEntryKeys as day (day)}
            <DayInFeed
                day={{
                    items: entries[day].map(e => ({ ...e, type: 'entry' })),
                    day,
                    nextDayInPast: null,
                    nextDayInFuture: null,
                    weather: null
                }}
                obfuscated={$obfuscated}
                {showLabels}
                {locations}
                {showForms}
                {labels}
            />
        {/each}
        <div
            use:inview={{ rootMargin: '200px' }}
            on:inview_enter={() => loadMoreEntries()}
            on:inview_leave={() => (pageEndInView = false)}
        />
        {#if loadingAt !== null && loadingAt < numberOfEntries}
            <Spinner />
        {/if}
    </div>
</div>
