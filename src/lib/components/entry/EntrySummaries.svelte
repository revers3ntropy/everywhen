<script lang="ts">
    import { slide } from 'svelte/transition';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import OpenInApp from 'svelte-material-icons/OpenInApp.svelte';
    import * as Dialog from '$lib/components/ui/dialog';
    import EntryDialog from '$lib/components/entry/EntryDialog.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import type { Location } from '$lib/controllers/location/location';
    import LabelDot from '$lib/components/label/LabelDot.svelte';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { listen } from '$lib/dataChangeEvents';
    import { Entry, type EntrySummary } from '$lib/controllers/entry/entry';
    import { currentTzOffset, fmtUtc, nowUtc, utcEq } from '$lib/utils/time';
    import Dot from '../ui/Dot.svelte';
    import UtcTime from '../ui/UtcTime.svelte';

    export let titles: Record<string, EntrySummary[]>;
    export let obfuscated = true;
    export let showTimeAgo = true;
    export let hideDate = false;
    export let blurToggleOnLeft = false;
    export let hideBlurToggle = false;
    export let locations: Location[];
    export let labels: Record<string, Label>;
    export let onCreateFilter: (entry: Entry) => boolean = () => true;
    export let showOnUpdateAndNotAlreadyShownFilter: (entry: Entry) => boolean = () => false;

    listen.entry.onCreate(entry => {
        if (!onCreateFilter(entry)) return;
        if (!titles) titles = {};

        const localDate = fmtUtc(entry.created, entry.createdTzOffset, 'YYYY-MM-DD');

        titles = {
            ...titles,
            [localDate]: [Entry.summaryFromEntry(entry), ...(titles?.[localDate] || [])].sort(
                (a, b) => b.created - a.created
            )
        };
    });
    listen.entry.onUpdate(entry => {
        if (!titles) titles = {};

        const localDate = fmtUtc(entry.created, entry.createdTzOffset, 'YYYY-MM-DD');

        if (!(titles[localDate] || []).find(e => e.id === entry.id)) {
            if (!showOnUpdateAndNotAlreadyShownFilter(entry)) {
                return;
            }
        }

        titles = {
            ...titles,
            [localDate]: [
                Entry.summaryFromEntry(entry),
                ...(titles[localDate] || []).filter(e => e.id !== entry.id)
            ].sort((a, b) => b.created - a.created)
        };
    });
    listen.entry.onDelete(id => {
        if (!titles) return;
        titles = Object.fromEntries(
            Object.entries(titles).map(([date, entries]) => [
                date,
                entries.filter(e => e.id !== id)
            ])
        );
    });

    let sortedTitles: [number, string][] | null;
    $: sortedTitles = titles
        ? Object.keys(titles)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
              .filter(Boolean)
              .map(date => [new Date(date).getTime() / 1000, date])
        : null;
</script>

<div>
    {#if !hideBlurToggle}
        <div class="menu {blurToggleOnLeft ? 'left' : ''}">
            <button
                aria-label={obfuscated ? 'Show entries' : 'Hide entries'}
                on:click={() => (obfuscated = !obfuscated)}
            >
                {#if obfuscated}
                    <Eye size="25" />
                {:else}
                    <EyeOff size="25" />
                {/if}
            </button>
        </div>
    {/if}

    {#if sortedTitles}
        {#each sortedTitles as [day, date] (date)}
            <div class="day" transition:slide={{ duration: ANIMATION_DURATION, axis: 'x' }}>
                {#if !hideDate}
                    <h2>
                        <UtcTime
                            timestamp={day}
                            fmt="ddd DD/MM/YYYY"
                            noTooltip={true}
                            tzOffset={0}
                        />
                        {#if showTimeAgo}
                            <Dot marginX={2} />
                            <span class="text-light">
                                {#if utcEq(nowUtc(), day, currentTzOffset(), 0, 'YYYY-MM-DD')}
                                    <span>Today</span>
                                {:else if utcEq(nowUtc() - 60 * 60 * 24, day, currentTzOffset(), 0, 'YYYY-MM-DD')}
                                    <span>Yesterday</span>
                                {:else}
                                    <UtcTime
                                        relative
                                        timestamp={day}
                                        noTooltip={true}
                                        tzOffset={0}
                                    />
                                {/if}
                            </span>
                        {/if}
                    </h2>
                {/if}

                {#if (titles || {})[date].length < 1}
                    <i class="text-light flex-center"> No entries on this day </i>
                {/if}

                {#each (titles || {})[date] as entry (entry.id)}
                    <span class="flex entry-container group">
                        <a class="entry" href="/journal#{entry.id}">
                            <span class="text-sm text-textColorLight w-full text-right">
                                <UtcTime
                                    timestamp={entry.created}
                                    fmt="h:mma"
                                    tzOffset={entry.createdTzOffset}
                                    tooltipPosition="right"
                                />
                            </span>

                            <LabelDot color={entry.labelId ? labels[entry.labelId]?.color : null} />

                            <span class="ellipsis max-w-[20vw]" class:obfuscated>
                                {#if entry.titleShortened}
                                    {entry.titleShortened}
                                {:else}
                                    <i class="text-light">
                                        {entry.bodyShortened}{#if entry.bodyShortened.length >= Entry.TITLE_LENGTH_CUTOFF}...
                                        {/if}
                                    </i>
                                {/if}
                            </span>
                        </a>

                        <span
                            class="hide-mobile opacity-0 group-hover:opacity-100 hover:bg-lightAccent flex-center rounded-md"
                        >
                            <Dialog.Root>
                                <Dialog.Trigger aria-label="Open entry in dialog">
                                    <OpenInApp size="20" />
                                </Dialog.Trigger>
                                <Dialog.Content>
                                    <EntryDialog id={entry.id} {locations} {labels} />
                                </Dialog.Content>
                            </Dialog.Root>
                        </span>
                    </span>
                {/each}
            </div>
        {/each}
    {/if}
</div>

<style lang="scss">
    @import '$lib/styles/text';

    .menu {
        display: flex;
        justify-content: flex-end;
        margin: 0.5rem 0;

        &.left {
            justify-content: flex-start;
        }
    }

    .day {
        margin: 0.6rem 0 0.9em 0;
        width: 100%;

        &:last-child {
            border-bottom: none;
        }

        h2 {
            font-size: 1rem;
            padding: 0;
            margin: 0.5em 0;
        }

        .entry {
            display: grid;
            grid-template-columns: 3.75rem 10px 1fr;
            gap: 4px;
            align-items: center;
            color: var(--text-color);
            padding: 2px;
            border-radius: 4px;
            width: 100%;
            text-align: left;
            height: calc(1rem + 6px);

            &:after {
                display: none;
            }

            &:hover {
                background-color: var(--light-accent);
            }
        }
    }
</style>
