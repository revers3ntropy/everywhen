<script lang="ts">
    import LabelDot from '$lib/components/label/LabelDot.svelte';
    import { listen } from '$lib/dataChangeEvents';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import { Entry, type EntryTitle } from '$lib/controllers/entry/entry';
    import { showPopup } from '$lib/utils/popups';
    import { obfuscate } from '$lib/utils/text';
    import { currentTzOffset, fmtUtc, nowUtc, utcEq } from '$lib/utils/time';
    import EntryDialog from '$lib/components/dialogs/EntryDialog.svelte';
    import Dot from '../Dot.svelte';
    import UtcTime from '../UtcTime.svelte';

    export let titles = null as Record<string, EntryTitle[]> | null;
    export let obfuscated = true;
    export let showTimeAgo = true;
    export let blurToggleOnLeft = false;
    export let hideBlurToggle = false;
    export let onCreateFilter: (entry: Entry) => boolean = () => true;
    export let showOnUpdateAndNotAlreadyShownFilter: (entry: Entry) => boolean = () => false;

    function showEntryPopup(entryId: string) {
        showPopup(EntryDialog, {
            id: entryId,
            obfuscated
        });
    }

    listen.entry.onCreate(({ entry }) => {
        if (!onCreateFilter(entry)) return;
        if (!titles) titles = {};

        const localDate = fmtUtc(entry.created, entry.createdTZOffset, 'YYYY-MM-DD');

        titles = {
            ...titles,
            [localDate]: [Entry.entryToTitleEntry(entry), ...(titles?.[localDate] || [])]
        };
    });
    listen.entry.onUpdate(entry => {
        if (!titles) titles = {};

        const localDate = fmtUtc(entry.created, entry.createdTZOffset, 'YYYY-MM-DD');

        if (!(titles[localDate] || []).find(e => e.id === entry.id)) {
            if (!showOnUpdateAndNotAlreadyShownFilter(entry)) {
                return;
            }
        }

        titles = {
            ...titles,
            [localDate]: [
                Entry.entryToTitleEntry(entry),
                ...(titles[localDate] || []).filter(e => e.id !== entry.id)
            ]
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
        {#each sortedTitles as [day, date]}
            <div class="day">
                <h2>
                    <UtcTime timestamp={day} fmt="dddd DD/MM/YYYY" noTooltip={true} tzOffset={0} />
                    {#if showTimeAgo}
                        <Dot marginX={2} />
                        <span class="text-light">
                            {#if utcEq(nowUtc(), day, currentTzOffset(), 0, 'YYYY-MM-DD')}
                                <span>Today</span>
                            {:else if utcEq(nowUtc() - 60 * 60 * 24, day, currentTzOffset(), 0, 'YYYY-MM-DD')}
                                <span>Yesterday</span>
                            {:else}
                                <UtcTime relative timestamp={day} noTooltip={true} tzOffset={0} />
                            {/if}
                        </span>
                    {/if}
                </h2>

                {#if (titles || {})[date].length < 1}
                    <i class="text-light flex-center"> No entries on this day </i>
                {/if}

                {#each (titles || {})[date] as entry}
                    <button class="entry" on:click={() => showEntryPopup(entry.id)}>
                        <span class="entry-time">
                            <UtcTime
                                timestamp={entry.created}
                                fmt="h:mma"
                                tzOffset={entry.createdTZOffset}
                                tooltipPosition="right"
                            />
                        </span>

                        <LabelDot name={entry.label?.name} color={entry.label?.color || null} />

                        <span class="title {obfuscated ? 'obfuscated' : ''}">
                            {#if entry.title}
                                {obfuscated ? obfuscate(entry.title) : entry.title}
                            {:else}
                                <i class="text-light">
                                    {obfuscated
                                        ? obfuscate(entry.entry)
                                        : entry.entry}{#if entry.entry.length >= Entry.TITLE_LENGTH_CUTOFF}...
                                    {/if}
                                </i>
                            {/if}
                        </span>
                    </button>
                {/each}
            </div>
        {/each}

        {#if Object.keys(titles || {}).length === 0}
            <div class="day">
                <i class="text-light"> No entries yet </i>
            </div>
        {/if}
    {/if}
</div>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/text';

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
            grid-template-columns: 50px 10px 1fr;
            gap: 5px;
            align-items: center;
            color: var(--text-color);
            padding: 2px 2px;
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

            .entry-time {
                font-size: 0.7rem;
                color: var(--text-color-light);
                width: 100%;
                text-align: center;
            }
        }
    }

    .title {
        .ellipsis();
        max-width: 350px;
    }
</style>
