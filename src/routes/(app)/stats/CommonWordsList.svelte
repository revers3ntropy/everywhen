<script lang="ts">
    import { Bar } from 'svelte-chartjs';
    import { slide } from 'svelte/transition';
    import {
        Chart,
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        type ChartOptions
    } from 'chart.js';
    import { browser } from '$app/environment';
    import { notify } from '$lib/components/notifications/notifications';
    import InfiniteScroller from '$lib/components/ui/InfiniteScroller.svelte';
    import { encryptionKey } from '$lib/stores';
    import { cssVarValue } from '$lib/utils/getCssVar';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { decrypt } from '$lib/utils/encryption';
    import type { LineChartData } from '../../../types';
    import { Skeleton } from '$lib/components/ui/skeleton';

    export let entryCount: number;
    export let uniqueWordCount: number;

    Chart.register(
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement
    );

    async function loadMoreWords() {
        const res = notify.onErr(
            await api.get('/stats/commonWords', { offset: words.length, count: 50 })
        );
        words = [...words, ...res.words];
    }

    async function getChartForWord(word: string) {
        const res = notify.onErr(await api.get(apiPath('/stats/commonWords/?', word), {}));
        wordsData = wordsData.set(word, {
            chartData: res.chartData
                ? {
                      ...res.chartData,
                      datasets: res.chartData.datasets.map(dataset => ({
                          ...dataset,
                          backgroundColor: cssVarValue('--text-color-light')
                      }))
                  }
                : null
        });
    }

    function toggleWordInfoAccordion(word: string) {
        if (wordsInfoAccordionOpen.has(word)) {
            wordsInfoAccordionOpen.delete(word);
            // trigger reactivity
            wordsInfoAccordionOpen = wordsInfoAccordionOpen;
        } else {
            wordsInfoAccordionOpen = wordsInfoAccordionOpen.add(word);
            if (!wordsData.has(word)) {
                getChartForWord(word);
            }
        }
    }

    function chartOptions(): ChartOptions<'bar'> {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    position: 'left',
                    border: { color: cssVarValue('--border-heavy') },
                    ticks: { color: cssVarValue('--text-color') },
                    grid: { drawOnChartArea: false },
                    min: 0,
                    title: {
                        display: true,
                        text: 'Occurrences',
                        color: cssVarValue('--text-color')
                    }
                },
                x: {
                    border: { color: cssVarValue('--border-heavy') },
                    ticks: { color: cssVarValue('--text-color') },
                    grid: { drawOnChartArea: false }
                }
            }
        } satisfies ChartOptions<'bar'>;
    }

    let words: { word: string; count: number }[] = [];
    let wordsData = new Map<string, { chartData: LineChartData | null }>();
    let wordsInfoAccordionOpen = new Set<string>();
</script>

{#if uniqueWordCount > 0}
    <div class="relative">
        <h2 class="text-left py-2">Common Words</h2>
        <InfiniteScroller
            loadItems={loadMoreWords}
            hasMore={() => words.length < uniqueWordCount}
            margin={500}
        >
            <div class="common-words">
                {#each words as { word, count }, i}
                    <button on:click={() => toggleWordInfoAccordion(word)} class="word">
                        <span class="text-light">#{i + 1}</span>
                        <span class="ellipsis" data-sveltekit-preload-data="tap">
                            {browser ? decrypt(word, $encryptionKey).unwrap() : ''}
                        </span>

                        <b class="count text-right">{count}</b>

                        <span class="hide-mobile text-right">
                            {(count / entryCount).toPrecision(3)} / entry
                        </span>
                    </button>

                    {#if wordsInfoAccordionOpen.has(word)}
                        {@const wordData = wordsData.get(word)}
                        <div transition:slide={{ axis: 'y' }} class="py-2">
                            {#if wordData && wordData.chartData}
                                <div class="h-50 w-full">
                                    <Bar data={wordData.chartData} options={chartOptions()} />
                                </div>
                            {:else}
                                <i class="text-light">Not enough data</i>
                            {/if}
                        </div>
                    {/if}
                {/each}
            </div>
            <div slot="loader" class="flex flex-col gap-4 p-2">
                <Skeleton class="w-full h-[35px]" />
                <Skeleton class="w-full h-[35px]" />
                <Skeleton class="w-full h-[35px]" />
                <Skeleton class="w-full h-[35px]" />
                <Skeleton class="w-full h-[35px]" />
                <Skeleton class="w-full h-[35px]" />
                <Skeleton class="w-full h-[35px]" />
                <Skeleton class="w-full h-[35px]" />
            </div>
        </InfiniteScroller>
    </div>
{/if}

<style lang="scss">
    @import '$lib/styles/text';

    .common-words {
        margin: 0.5em 0;
        max-width: 50rem;

        @media #{$mobile} {
            margin: 10px 0;
            padding: 10px 2px;

            .count {
                text-align: right;
                margin-right: 2rem;
            }
        }
    }

    .word {
        width: 100%;
        display: grid;
        grid-template-columns: 3rem 1fr 5rem 10rem;
        grid-row-gap: 0.3rem;
        align-items: center;
        text-align: left;
        padding: 0.5rem 0.5rem;

        @media #{$mobile} {
            grid-template-columns: 3rem 1fr 1fr;
        }

        border-top: 1px solid var(--border-light);

        &:hover {
            background-color: var(--accent);
        }
    }
</style>
