<script lang="ts">
    import { displayNotifOnErr } from '$lib/components/notifications/notifications.js';
    import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import { By } from '../helpers';
    import SearchForWord from '../SearchForWord.svelte';
    import StatPill from '../StatPill.svelte';
    import EntryBarChart from '../EntryChart.svelte';
    import EntryHeatMap from '../EntryHeatMap.svelte';
    import type { PageData } from './$types';
    import { encrypt } from '$lib/security/encryption.client';

    let by: By = By.Words;

    export let data: PageData;
</script>

<svelte:head>
    <title>Insights</title>
</svelte:head>

<main>
    <div class="title-line">
        <div>
            <a class="with-icon" href="/stats">
                <ArrowLeft size="40" />
                Analytics
            </a>
        </div>
        <div>
            <h1>
                <span class="stats-icon">
                    <Counter size="40" />
                </span>
                <span class="the-word-with-quotes">
                    '<span class="the-word">{data.theWord}</span>'
                </span>
            </h1>
        </div>
        <div class="search-for-word">
            <SearchForWord value={data.theWord} auth={data.auth} />
        </div>
    </div>
    {#if data.wordInstances === 0}
        <section class="container invisible">
            <div class="flex-center">
                <p>
                    You've never used that word before!
                    <a href="/journal">Why not try it out?</a>
                </p>
            </div>
        </section>
    {:else}
        <section class="container invisible">
            <div class="stats">
                <StatPill primary beforeLabel="appears" value={data.wordInstances} label="times" />
                <StatPill
                    beforeLabel="in"
                    value={data.entries.length}
                    label="({((data.entries.length / data.totalEntries) * 100).toFixed(
                        1
                    )}%) entries"
                />
                <StatPill
                    value={(data.wordInstances / data.totalEntries).toFixed(1)}
                    label="times / entry"
                />
            </div>
        </section>

        <section class="charts">
            <div class="container" style="margin: 0; padding: 1rem;">
                <EntryHeatMap {by} entries={data.entries} />
            </div>
            <div class="container" style="margin: 1rem 0; padding: 1rem;">
                <EntryBarChart {by} entries={data.entries} />
            </div>
        </section>

        <section class="entries">
            <Entries
                auth={data.auth}
                options={{
                    search: displayNotifOnErr(encrypt(data.theWord, data.auth.key))
                }}
                showSearch={false}
            />
        </section>
    {/if}
</main>

<style lang="less">
    @import '../../../../styles/layout';
    @import '../../../../styles/variables';
    @import '../../../../styles/text';

    .title-line {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: center;

        .search-for-word {
            text-align: right;
        }

        @media @mobile {
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
        .flex-center();
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
        .ellipsis();
        max-width: calc(100vw - 400px);
    }
</style>
