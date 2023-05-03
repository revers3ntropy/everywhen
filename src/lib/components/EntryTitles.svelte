<script lang="ts">
    import { tooltip } from '@svelte-plugins/tooltips';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import { Entry } from '../controllers/entry';
    import type { Auth } from '../controllers/user';
    import { showPopup } from '../utils/popups';
    import { obfuscate } from '../utils/text';
    import { nowUtc, utcEq } from '../utils/time';
    import EntryDialog from './dialogs/EntryDialog.svelte';
    import Dot from './Dot.svelte';
    import UtcTime from './UtcTime.svelte';

    export let titles: Record<string, Entry[]>;
    export let obfuscated = true;
    export let showTimeAgo = true;
    export let auth: Auth;
    export let blurToggleOnLeft = false;
    export let hideBlurToggle = false;
    export let hideAgentWidget: boolean;

    function showEntryPopup(entryId: string) {
        showPopup(EntryDialog, {
            id: entryId,
            auth,
            obfuscated,
            hideAgentWidget
        });
    }

    let sortedTitles: [number, string][];
    $: sortedTitles = Object.keys(titles)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .filter(Boolean)
        .map(date => [new Date(date).getTime() / 1000, date]);
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

    {#each sortedTitles as [day, date]}
        <div class="day">
            <h2>
                <UtcTime timestamp={day} fmt="dddd DD/MM/YY" noTooltip={true} />
                {#if showTimeAgo}
                    <Dot />
                    <span class="text-light">
                        {#if utcEq(nowUtc(), day)}
                            <span>Today</span>
                        {:else if utcEq(nowUtc() - 60 * 60 * 24, day)}
                            <span>Yesterday</span>
                        {:else}
                            <UtcTime
                                relative
                                timestamp={day}
                                noTooltip={true}
                            />
                        {/if}
                    </span>
                {/if}
            </h2>

            {#each titles[date] as entry}
                <button class="entry" on:click={() => showEntryPopup(entry.id)}>
                    <span class="entry-time">
                        <UtcTime
                            timestamp={entry.created}
                            fmt="h:mma"
                            tzOffset={entry.createdTZOffset}
                            tooltipPosition="right"
                        />
                    </span>
                    {#if entry.label}
                        <span
                            class="entry-label-colour"
                            style="background: {entry.label?.colour ||
                                'transparent'}"
                            use:tooltip={{ content: entry.label?.name }}
                        />
                    {:else}
                        <span class="entry-label-colour" />
                    {/if}

                    <span class="title {obfuscated ? 'obfuscated' : ''}">
                        {#if entry.title}
                            {obfuscated ? obfuscate(entry.title) : entry.title}
                        {:else}
                            <i class="text-light">
                                {obfuscated
                                    ? obfuscate(entry.entry)
                                    : entry.entry}{#if entry.entry.length >= Entry.TITLE_CUTOFF}...
                                {/if}
                            </i>
                        {/if}
                    </span>
                </button>
            {/each}
        </div>
    {/each}

    {#if Object.keys(titles).length === 0}
        <div class="day">
            <h2> No entries yet </h2>
        </div>
    {/if}
</div>

<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/text';

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

        &:last-child {
            border-bottom: none;
        }

        h2 {
            font-size: 1rem;
            padding: 0;
            margin: 0.5em 0 0.5em 2em;
        }

        .entry {
            display: grid;
            grid-template-columns: 65px 18px 1fr;
            padding: 2px 2px;
            align-items: center;
            color: @text-color;
            border-radius: 2px;
            width: 100%;
            text-align: left;

            &:after {
                display: none;
            }

            &:hover {
                background-color: @light-accent;
            }

            .entry-time {
                font-size: 0.7rem;
                color: @text-color-light;
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
