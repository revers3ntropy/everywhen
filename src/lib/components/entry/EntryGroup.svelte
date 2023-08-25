<script lang="ts" context="module">
    import { writable } from 'svelte/store';
    import type { Writable } from 'svelte/store';

    let collapsed: Writable<Record<number, boolean>> = writable({});
</script>

<script lang="ts">
    import { page } from '$app/stores';
    import { currentlyUploadingEntries } from '$lib/stores';
    import { fly, slide } from 'svelte/transition';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import ModedEntryForm from '$lib/components/entryForm/ModedEntryForm.svelte';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { listen } from '$lib/dataChangeEvents';
    import Entry from '$lib/components/entry/Entry.svelte';
    import type { Entry as EntryController } from '$lib/controllers/entry/entry';
    import type { Location } from '$lib/controllers/location/location';
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import { currentTzOffset, nowUtc, utcEq } from '$lib/utils/time';
    import Dot from '../Dot.svelte';
    import UtcTime from '../UtcTime.svelte';

    export let locations: Location[] | null;
    export let obfuscated = true;
    export let entries: EntryController[];
    export let showLabels = true;
    export let showLocations = true;
    export let showEntryForm = false;
    export let entryFormMode = null as null | EntryFormMode;
    export let day: number;

    function toggleCollapse() {
        $collapsed[day] = !$collapsed[day];
    }

    function scrollToEntry(id: string) {
        setTimeout(() => {
            const el = document.getElementById(id);
            if (!el) {
                console.error('Could not find new entry element');
                return;
            }
            el.tabIndex = -1;
            el.focus({ preventScroll: false });
        }, 10);
    }

    if (entryFormMode === null && showEntryForm) {
        throw new Error('entryFormMode must be set if showEntryForm is true');
    }
    let formMode: EntryFormMode;
    $: if (showEntryForm) {
        formMode = entryFormMode as EntryFormMode;
    }

    $: isToday = utcEq(nowUtc(), day, currentTzOffset(), 0, 'YYYY-MM-DD');
    $: $collapsed[day] = entries.length < 1 && (!isToday || !showEntryForm);

    listen.entry.onCreate(({ entry, entryMode }) => {
        if (!isToday) return;
        entries = [...entries, entry].sort((a, b) => b.created - a.created);
        if (entryMode === EntryFormMode.Standard) {
            scrollToEntry(entry.id);
        }
    });
    listen.entry.onDelete(id => {
        entries = entries.filter(entry => entry.id !== id);
    });
    listen.entry.onUpdate(entry => {
        const i = entries.findIndex(e => e.id === entry.id);
        if (i !== -1) {
            entries[i] = entry;
        }
    });

    page.subscribe(() => {
        collapsed.set({});
    });
</script>

<div class="entry-group">
    <div class="title">
        <div>
            <h3>
                <button class="flex-center" on:click={toggleCollapse}>
                    {#if $collapsed[day]}
                        <ChevronDown size="25" />
                    {:else}
                        <ChevronUp size="25" />
                    {/if}

                    <UtcTime fmt="ddd, Do MMMM YYYY" noTooltip timestamp={day} tzOffset={0} />

                    <Dot light marginX={10} />

                    <span class="text-light">
                        {#if isToday}
                            <span>Today</span>
                        {:else if utcEq(nowUtc() - 60 * 60 * 24, day, currentTzOffset(), 0, 'YYYY-MM-DD')}
                            <span>Yesterday</span>
                        {:else}
                            <UtcTime relative timestamp={day} tzOffset={0} />
                        {/if}
                    </span>

                    {#if $collapsed[day]}
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
                                {entries.length}
                                {entries.length === 1 ? 'entry' : 'entries'}
                            </p>
                        </div>
                    {/if}
                </button>
            </h3>
        </div>
    </div>
    {#if !$collapsed[day]}
        {#if showEntryForm && isToday}
            <ModedEntryForm {obfuscated} entryFormMode={formMode} />
        {/if}
        <div
            class="contents"
            transition:slide|local={{
                axis: 'y',
                duration: ANIMATION_DURATION
            }}
        >
            {#if isToday && $currentlyUploadingEntries}
                {#each { length: $currentlyUploadingEntries } as i}
                    <Entry
                        id="temp-{i}"
                        title=""
                        entry="..."
                        created={nowUtc()}
                        {obfuscated}
                        {showLabels}
                        {showLocations}
                        {locations}
                        flags={0}
                        wordCount={0}
                    />
                {/each}
            {/if}
            {#each entries as entry (entry.id)}
                <Entry {...entry} {obfuscated} {showLabels} {showLocations} {locations} />
            {/each}
        </div>
    {/if}
</div>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';

    .entry-group {
        width: 100%;
        margin: 0;
        padding: 0;

        transition: height @transition;

        @media @not-mobile {
            .container();
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
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.4rem 0.8rem;

            @media @mobile {
                border-radius: @border-radius;
                background: var(--v-light-accent);
                border: 1px solid var(--border-color);
                margin: 0.5rem 0;
                padding: 0.4rem 0.8rem 0.4rem 0;
                position: sticky;
                top: 0.3em;
                z-index: 4;
            }

            .entry-count {
                font-size: 1rem;

                &,
                & * {
                    color: var(--text-color-light);
                }
            }

            h3 {
                font-weight: normal;
            }
        }

        @media @mobile {
            margin: 0;
            border: none;
            border-radius: 0;
        }

        .contents {
            padding: 0 0 1em 0;
        }
    }
</style>
