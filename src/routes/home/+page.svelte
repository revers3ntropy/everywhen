<script lang="ts">
    import { onMount } from 'svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import type { App } from '../../app';
    import EntryTitles from '../../lib/components/EntryTitles.svelte';
    import type { Entry } from '../../lib/controllers/entry';
    import { obfuscated } from '../../lib/stores.js';
    import {
        currentTzOffset,
        dayUtcFromTimestamp,
        fmtUtc,
        nowUtc
    } from '../../lib/utils/time';

    export let data: App.PageData & {
        titles: Record<number, Entry[]>;
        entries: Entry[];
    };

    onMount(() => (document.title = `Home`));

    function entriesYearsAgoToday(entries: Entry[]): Record<string, Entry[]> {
        const res: Record<string, Entry[]> = {};
        const nowDate = fmtUtc(nowUtc(), currentTzOffset(), 'MM-DD');
        const nowYear = fmtUtc(nowUtc(), currentTzOffset(), 'YYYY');

        for (const entry of entries) {
            const entryDate = fmtUtc(
                entry.created,
                entry.createdTZOffset,
                'MM-DD'
            );
            // entries on the same day and month, but not this year
            if (entryDate === nowDate) {
                const entryYear = fmtUtc(
                    entry.created,
                    entry.createdTZOffset,
                    'YYYY'
                );
                if (entryYear !== nowYear) {
                    const yearsAgo = parseInt(nowYear) - parseInt(entryYear);
                    if (!res[yearsAgo]) {
                        res[yearsAgo] = [];
                    }
                    res[yearsAgo].push(entry);
                }
            }
        }
        return res;
    }
</script>

<main>
    <section>
        <div class="buttons">
            <a class="primary" href="/journal">
                <Notebook size="25" />
                Journal
            </a>
            <a class="icon-gradient-on-hover" href="/labels">
                <LabelOutline size="25" />
                Labels
            </a>
            <a class="icon-gradient-on-hover" href="/events">
                <Calendar size="25" />
                Events
            </a>
            <a class="icon-gradient-on-hover" href="/assets">
                <ImageOutline size="25" />
                Gallery
            </a>
            <a class="icon-gradient-on-hover" href="/settings">
                <Cog size="25" />
                Settings
            </a>
        </div>
    </section>
    {#if Object.keys(data.titles || {}).length}
        <section>
            <h1>Recent Entries</h1>
            <EntryTitles
                auth="{data}"
                titles="{data.titles}"
                obfuscated="{$obfuscated}"
            />
        </section>
    {:else}
        <section>
            <h1 class="recent-entries">Recent Entries</h1>
            <p class="recent-entries-text">
                Doesn't look like you have any entries yet, why not <a
                    href="/journal?obfuscate=0">write one</a
                >?
            </p>
        </section>
    {/if}
    {#each Object.entries(entriesYearsAgoToday(data.entries)) as [yearsAgo, titles]}
        <section>
            <h1>
                {yearsAgo === '1' ? `A Year` : `${yearsAgo} Years`} Ago Today
            </h1>
            <EntryTitles
                titles="{{
                    [dayUtcFromTimestamp(
                        titles[0].created,
                        titles[0].createdTZOffset
                    )]: titles
                }}"
                obfuscated="{$obfuscated}"
                showTimeAgo="{false}"
                auth="{data}"
            />
        </section>
    {/each}
</main>

<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/layout';

    .buttons {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        @media @mobile {
            flex-direction: column;
        }

        a,
        button {
            display: grid;
            align-items: center;
            justify-content: space-between;
            // assumed one svg icon and then text
            grid-template-columns: 35px 1fr;
            font-size: 1.2rem;
            padding: 0.6em 0.8em;
            margin: 1em;
            text-decoration: none;
            transition: all @transition;

            &:after {
                display: none;
            }

            &:not(.primary) {
                border-radius: @border-radius;
                border: 1px solid @light-accent;

                &:hover {
                    background: @light-v-accent;
                    color: @accent-color-secondary;
                    text-decoration: none;
                }
            }

            @media @mobile {
                .bordered();

                padding: 0.5em;
                margin: 0.2em;
                text-align: center;
            }
        }
    }

    h1 {
        font-size: 1.5rem;
        // negative on the bottom to put in line with the titles due
        // to the visibility toggle being inline
        margin: 1em 1em -22px 1em;
        padding: 0.5em;
        border-bottom: 1px solid @light-accent;
        text-align: start;

        @media @mobile {
            font-size: 1.2rem;
        }

        &.recent-entries {
            margin: 1rem;
        }
    }

    .recent-entries-text {
        margin: 0.5rem;
    }
</style>
