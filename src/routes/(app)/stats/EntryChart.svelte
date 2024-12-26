<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications.js';
    import { By, Grouping, Stats, type StatsData } from '$lib/controllers/stats/stats';
    import { Day } from '$lib/utils/day';
    import { fmtUtc } from '$lib/utils/time';
    import {
        Chart,
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement
    } from 'chart.js';
    import { onMount } from 'svelte';
    import { Line } from 'svelte-chartjs';
    import Select from '$lib/components/Select.svelte';
    import { cssVarValue } from '$lib/utils/getCssVar';
    import { theme } from '$lib/stores';

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

    export let days: number;

    export let getBucketisedData: (
        bucket: Grouping,
        from?: Day | null,
        to?: Day | null
    ) => Promise<StatsData>;

    export function initialBucket(days: number): Grouping {
        if (days < 7 + 3) return Grouping.Day;
        if (days < 7 * 14) return Grouping.Week;
        if (days < 365 * 10) return Grouping.Month;
        return Grouping.Year;
    }

    function options() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    border: { color: cssVarValue('var(--border-light') },
                    ticks: { color: cssVarValue('--text-color-light') },
                    grid: { display: false },
                    suggestedMin: 0
                },
                x: {
                    border: { color: cssVarValue('--border-light') },
                    ticks: { color: cssVarValue('--text-color-light') },
                    grid: { display: false }
                }
            }
        };
    }

    async function changeMainChartGrouping(newGrouping: string) {
        const grouping = Stats.groupingFromString(newGrouping);
        if (!grouping) {
            notify.error('Invalid grouping');
            return;
        }
        selectedBucket = grouping;
        if (days < 2) {
            return;
        }
        mainChartData = await getBucketisedData(
            grouping,
            getMainChartDataFrom(selectedBucket),
            Day.todayUsingNativeDate()
        );
    }

    function getMainChartDataFrom(bucket: Grouping): Day | null {
        switch (bucket) {
            case Grouping.Day:
                return Day.todayUsingNativeDate().plusDays(-31 * 6);
            case Grouping.Month:
                return Day.todayUsingNativeDate()
                    .plusMonths(-12 * 10)
                    .startOfYear();
            case Grouping.Year:
                return new Day(0, 1, 1);
            default:
                throw new Error('Invalid bucket');
        }
    }

    let selectedBucket = initialBucket(days);
    let mainChartData: StatsData | null = null;
    let timeOfDayData: StatsData | null = null;
    let dayOfWeekData: StatsData | null = null;
    onMount(async () => {
        void changeMainChartGrouping(selectedBucket);
        getBucketisedData(Grouping.Hour, new Day(0, 1, 1)).then(data => {
            timeOfDayData = data;
        });
        dayOfWeekData = await getBucketisedData(Grouping.DayOfWeek, new Day(0, 1, 1));
    });
</script>

<!--
    the styling for the chart uses variables in the config which depend on the theme
    but do not get updated when the theme changes - i.e. they get the values
    from the theme when they are rendered - we need to manually update when the theme
    changes or the chart colours will not update
-->
{#key $theme}
    {#if mainChartData}
        <div class="border-b border-borderColor pt-4 pb-4">
            <div class="h-[350px] overflow-x-auto md:px-4 w-fit max-w-full" style="direction: rtl">
                <div
                    class="h-full min-w-10 px-2"
                    style="width: {Math.max(mainChartData.labels.length * 25 + 30, 300)}px"
                >
                    <Line
                        data={{
                            labels: mainChartData.labels,
                            datasets: [
                                {
                                    backgroundColor: cssVarValue('--primary'),
                                    borderColor: cssVarValue('--primary'),
                                    borderWidth: 1,
                                    data: mainChartData.values[By.Entries],
                                    label: 'Entries'
                                },
                                {
                                    backgroundColor: cssVarValue('--primary-light'),
                                    borderColor: cssVarValue('--primary-light'),
                                    borderWidth: 1,
                                    data: mainChartData.values[By.Words],
                                    label: 'Words'
                                }
                            ]
                        }}
                        options={options()}
                    />
                </div>
            </div>

            <div class="pt-4 px-2">
                <span class="py-2 px-3 bg-vLightAccent rounded-xl">
                    <span class="text-light mr-1"> Group by </span>
                    <Select
                        value={selectedBucket}
                        onChange={key => changeMainChartGrouping(key)}
                        key={selectedBucket}
                        options={{
                            Year: Grouping.Year,
                            Month: Grouping.Month,
                            Day: Grouping.Day
                        }}
                    />
                </span>
            </div>
        </div>
    {/if}

    <div class="py-4 md:p-4 md:flex justify-between">
        <div class="flex-1">
            {#if timeOfDayData}
                <h3 class="pl-2"> Time of Day </h3>
                <div class="h-[250px] px-2" style="width: calc(100% - 1rem)">
                    <Line
                        data={{
                            labels: Array(24)
                                .fill(0)
                                .map((_, i) => fmtUtc((i % 24) * 60 * 60, 0, 'ha')),
                            datasets: [
                                {
                                    backgroundColor: cssVarValue('--primary'),
                                    borderColor: cssVarValue('--primary'),
                                    borderWidth: 1,
                                    data: timeOfDayData.values[By.Entries],
                                    label: 'Entries'
                                },
                                {
                                    backgroundColor: cssVarValue('--primary-light'),
                                    borderColor: cssVarValue('--primary-light'),
                                    borderWidth: 1,
                                    data: timeOfDayData.values[By.Words],
                                    label: 'Words'
                                }
                            ]
                        }}
                        options={options()}
                    />
                </div>
            {/if}
        </div>
        <div class="flex-1">
            {#if dayOfWeekData}
                <h3 class="pl-2"> Day of Week </h3>
                <div class="h-[250px] px-2" style="width: calc(100% - 1rem)">
                    <Line
                        data={{
                            labels: dayOfWeekData.labels,
                            datasets: [
                                {
                                    backgroundColor: cssVarValue('--primary'),
                                    borderColor: cssVarValue('--primary'),
                                    borderWidth: 1,
                                    data: dayOfWeekData.values[By.Entries],
                                    label: 'Entries'
                                },
                                {
                                    backgroundColor: cssVarValue('--primary-light'),
                                    borderColor: cssVarValue('--primary-light'),
                                    borderWidth: 1,
                                    data: dayOfWeekData.values[By.Words],
                                    label: 'Words'
                                }
                            ]
                        }}
                        options={options()}
                    />
                </div>
            {/if}
        </div>
    </div>
{/key}
