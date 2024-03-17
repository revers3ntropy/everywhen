<script lang="ts">
    import { browser } from '$app/environment';
    import { Auth } from '$lib/controllers/auth/auth';
    import { Day } from '$lib/utils/day';
    import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import ToggleSwitch from 'svelte-material-icons/ToggleSwitch.svelte';
    import ToggleSwitchOff from 'svelte-material-icons/ToggleSwitchOff.svelte';
    import { By } from '../helpers';
    import SearchForWord from '../SearchForWord.svelte';
    import StatPill from '../StatPill.svelte';
    import EntryChart from '../EntryChart.svelte';
    import EntryHeatMap from '../EntryHeatMap.svelte';
    import type { PageData } from './$types';
    import { encryptionKey } from '$lib/stores';

    export let data: PageData;

    function toggleBy() {
        by = by === By.Entries ? By.Words : By.Entries;
    }

    let by: By = By.Entries;

    $: theWordDecrypted = browser ? Auth.decryptOrLogOut(data.theWord, $encryptionKey) : '...';
</script>

<svelte:head>
    <title>Insights</title>
</svelte:head>

<main class="md:p-4 md:ml-16">
    <div class="title-line">
        <div class="flex align-center gap-2">
            <a href="/stats">
                <ArrowLeft size="25" />
            </a>
            <button class="flex-center gap-1 bg-vLightAccent rounded-full px-2" on:click={toggleBy}>
                <span class:text-light={by !== By.Words}> By Words </span>
                {#if by === By.Entries}
                    <ToggleSwitch size="30" />
                {:else}
                    <ToggleSwitchOff size="30" />
                {/if}
                <span class:text-light={by !== By.Entries}> By Entries </span>
            </button>
        </div>
        <div class="pb-4">
            <h1>
                <span class="stats-icon">
                    <Counter size="40" />
                </span>
                <SearchForWord value={theWordDecrypted} />
            </h1>
        </div>
        <div class=""> </div>
    </div>
    {#if data.wordInstances === 0}
        <section>
            <div class="flex-center">
                <p>
                    You've never used that word before!
                    <a href="/journal">Why not try it out?</a>
                </p>
            </div>
        </section>
    {:else}
        <section class="flex flex-wrap gap-8 container md:p-4">
            <StatPill beforeLabel="appears" value={data.wordInstances} label="times" />
            <StatPill
                beforeLabel="in"
                value={data.entries.length}
                label="({((data.entries.length / data.totalEntries) * 100).toFixed(1)}%) entries"
            />
            <StatPill
                value={(data.wordInstances / data.totalEntries).toFixed(1)}
                label="times / entry"
            />
        </section>

        <section class="charts">
            <div class="container" style="margin: 0; padding: 1rem;">
                <EntryHeatMap
                    {by}
                    data={data.heatMapData}
                    earliestEntryDay={Day.fromString(data.dayOfFirstEntryWithWord).unwrap()}
                />
            </div>
            <div class="container" style="margin: 1rem 0; padding: 1rem;">
                <EntryChart {by} entries={data.entries} days={data.days} />
            </div>
        </section>

        <section class="entries">
            <Entries
                options={{
                    search: data.theWord
                }}
                locations={data.locations}
                labels={data.labels}
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
            grid-template-columns: 1fr;

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
