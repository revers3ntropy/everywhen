<script lang="ts">
    import moment from 'moment';
    import { onMount } from 'svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import type { App } from '../../app';
    import EntryTitles from '../../lib/components/EntryTitles.svelte';
    import type { Entry } from '../../lib/controllers/entry';
    import { obfuscated } from '../../lib/stores.js';
    import type { Seconds } from '../../lib/utils/types';

    export let data: App.PageData & {
        titles: Record<number, Entry[]>,
        entries: Entry[],
    };

    onMount(() => document.title = `Home`);

    function entriesYearsAgoToday<T extends { created: Seconds }> (
        entries: T[],
    ): Record<string, T[]> {
        const res: Record<string, T[]> = {};
        const nowTime = moment();
        for (const entry of entries) {
            const entryTime = moment(new Date(entry.created * 1000));
            // entries on the same day and month, but not this year
            if (
                entryTime.date() === nowTime.date()
                && entryTime.month() === nowTime.month()
                && entryTime.year() !== nowTime.year()
            ) {
                const yearsAgo = nowTime.year() - entryTime.year();
                if (!res[yearsAgo]) {
                    res[yearsAgo] = [];
                }
                res[yearsAgo].push(entry);
            }
        }
        return res;
    }
</script>

<main>
    <section>
        <div class="buttons">
            <a class="primary" href="/diary">
                <Notebook size="30" />
                Diary
            </a>
            <a class="primary" href="/events">
                <Calendar size="30" />
                Events
            </a>
            <a class="primary" href="/labels">
                <LabelOutline size="30" />
                Labels
            </a>
            <a class="primary" href="/timeline">
                <ChartTimeline size="30" />
                Timeline
            </a>
            <a class="primary" href="/stats">
                <Counter size="30" />
                Stats
            </a>
            <a class="primary" href="/assets">
                <ImageOutline size="30" />
                Assets
            </a>
            <a class="primary" href="/settings">
                <Cog size="30" />
                Settings
            </a>
        </div>
    </section>
    {#if Object.keys(data.titles || {}).length}
        <section>
            <h1>Recent Entries</h1>
            <EntryTitles
                titles={data.titles}
                obfuscated={$obfuscated}
            />
        </section>
    {:else}
        <section>
            <h1>Recent Entries</h1>
            Doesn't look like you have any entries yet.
            Why not <a href="/diary">write one</a>?
        </section>
    {/if}
    {#each Object.entries(entriesYearsAgoToday(data.entries)) as [yearsAgo, titles]}
        <section>
            <h1>
                {yearsAgo === '1' ? `A Year` : `${yearsAgo} Years`} Ago Today
            </h1>
            <EntryTitles
                titles={{ [titles[0].created]: titles }}
                obfuscated={$obfuscated}
            />
        </section>
    {/each}
</main>

<style lang="less">
    @import '../../styles/variables.less';
    @import '../../styles/layout.less';

    .buttons {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        @media @mobile {
            flex-direction: column;
        }

        a, button {
            display: grid;
            align-items: center;
            justify-content: space-between;
            // assumed one svg icon and then text
            grid-template-columns: 35px 1fr;
            font-size: 1.2rem;
            padding: .7em 1.2em;
            margin: 1em;
            border-radius: 5px;
            text-decoration: none;
            transition: all 0.2s ease;
            color: @accent-color-primary;

            &:after {
                display: none;
            }

            &:hover {
                background: @light-accent;
                color: @accent-color-secondary;
                text-decoration: none;

                :global(svg), :global(svg *) {
                    color: @accent-color-secondary !important;
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
        margin: 1em;
        padding: 0.5em;
        border-bottom: 1px solid @light-accent;
        text-align: start;

        @media @mobile {
            font-size: 1.2rem;
        }
    }
</style>
