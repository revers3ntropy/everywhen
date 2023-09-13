<script lang="ts">
    import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import { By } from '../helpers';
    import SearchForWord from '../SearchForWord.svelte';
    import StatPill from '../StatPill.svelte';
    import EntryBarChart from '../EntryChart.svelte';
    import EntryHeatMap from '../EntryHeatMap.svelte';
    import type { PageData } from './$types';
    import { encrypt } from '$lib/utils/encryption';
    import { encryptionKey, navExpanded } from '$lib/stores';

    let by: By = By.Words;

    export let data: PageData;
    const { locations, theWord, wordInstances, totalEntries, entries } = data;
</script>

<svelte:head>
    <title>Insights</title>
</svelte:head>

<main class="md:p-4 {$navExpanded ? 'md:ml-48' : 'md:ml-16'}">
    <div class="title-line">
        <div>
            <a class="with-icon" href="/stats">
                <ArrowLeft size="40" />
                Insights
            </a>
        </div>
        <div>
            <h1>
                <span class="stats-icon">
                    <Counter size="40" />
                </span>
                <span class="the-word-with-quotes">
                    '{theWord}'
                </span>
            </h1>
        </div>
        <div class="search-for-word">
            <SearchForWord value={theWord} />
        </div>
    </div>
    {#if wordInstances === 0}
        <section>
            <div class="flex-center">
                <p>
                    You've never used that word before!
                    <a href="/journal">Why not try it out?</a>
                </p>
            </div>
        </section>
    {:else}
        <section>
            <div class="stats">
                <StatPill primary beforeLabel="appears" value={wordInstances} label="times" />
                <StatPill
                    beforeLabel="in"
                    value={entries.length}
                    label="({((entries.length / totalEntries) * 100).toFixed(1)}%) entries"
                />
                <StatPill value={(wordInstances / totalEntries).toFixed(1)} label="times / entry" />
            </div>
        </section>

        <section class="charts">
            <div class="container" style="margin: 0; padding: 1rem;">
                <EntryHeatMap {by} {entries} />
            </div>
            <div class="container" style="margin: 1rem 0; padding: 1rem;">
                <EntryBarChart {by} {entries} />
            </div>
        </section>

        <section class="entries">
            <Entries
                options={{
                    search: encrypt(theWord, $encryptionKey, true)
                }}
                {locations}
            />
        </section>
    {/if}
</main>

<style lang="scss">
    @import '$lib/styles/layout';

    @import '$lib/styles/text';

    .title-line {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: center;

        .search-for-word {
            text-align: right;
        }

        @media #{$mobile} {
            margin: 1rem;
            grid-template-columns: 10px 1fr;

            .search-for-word {
                font-size: 1.5rem;
                margin: 0.4rem 0;
            }

            .stats-icon,
            .the-word-with-quotes {
                display: none;
            }
        }
    }

    h1 {
        @extend .flex-center;
        font-size: 40px;
        margin: 0;
        padding: 0;

        span {
            margin-left: 0.5rem;
        }
    }

    .stats {
        text-align: center;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
    }

    .the-word-with-quotes {
        @extend .ellipsis;
        max-width: calc(100vw - 400px);
    }
</style>
