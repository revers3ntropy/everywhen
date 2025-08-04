<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications.js';
    import { By, Grouping, Stats, type StatsData } from '$lib/controllers/stats/stats';
    import { Day } from '$lib/utils/day';
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
    import { onMount } from 'svelte';
    import { Line } from 'svelte-chartjs';
    import Select from '$lib/components/ui/Select.svelte';
    import { cssVarValue } from '$lib/utils/getCssVar';
    import { theme } from '$lib/stores';
    import { CSLogger } from '$lib/controllers/logs/logger.client';

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

    function options(): ChartOptions<'line'> {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: cssVarValue('--text-color')
                    }
                }
            },
            scales: {
                'y-left': {
                    position: 'left',
                    border: { color: cssVarValue('--border-heavy') },
                    ticks: { color: cssVarValue('--text-color') },
                    grid: { drawOnChartArea: false },
                    min: 0,
                    title: {
                        display: true,
                        text: 'Entries',
                        color: cssVarValue('--text-color')
                    }
                },
                'y-right': {
                    position: 'right',
                    border: { color: cssVarValue('--border-heavy') },
                    ticks: { color: cssVarValue('--text-color') },
                    grid: { drawOnChartArea: false },
                    min: 0,
                    title: {
                        display: true,
                        text: 'Words',
                        color: cssVarValue('--text-color')
                    }
                },
                x: {
                    border: { color: cssVarValue('--border-heavy') },
                    ticks: { color: cssVarValue('--text-color') },
                    grid: { drawOnChartArea: false }
                }
            }
        };
    }

    async function changeChartGrouping(newGrouping: string) {
        const grouping = Stats.groupingFromString(
            selectGroupingOptions[newGrouping as keyof typeof selectGroupingOptions]
        );
        if (!grouping) {
            void CSLogger.error('invalid grouping', { grouping, newGrouping });
            notify.error('Invalid grouping');
            return;
        }
        selectedBucket = grouping;
        if (days < 2) return;

        chartData = await getBucketisedData(
            grouping,
            getChartDataFrom(selectedBucket),
            Day.todayUsingNativeDate()
        );
    }

    function getChartDataFrom(bucket: Grouping): Day | null {
        switch (bucket) {
            case Grouping.Day:
                return Day.todayUsingNativeDate().plusDays(-31 * 6);
            case Grouping.Week:
                return Day.todayUsingNativeDate().plusMonths(-12 * 2);
            case Grouping.Month:
                return Day.todayUsingNativeDate()
                    .plusMonths(-12 * 10)
                    .startOfYear();
            case Grouping.Year:
            case Grouping.Hour:
            case Grouping.DayOfWeek:
                return new Day(0, 1, 1);
            default:
                throw new Error('Invalid bucket');
        }
    }

    const selectGroupingOptions = {
        'Time of Day': Grouping.Hour,
        Day: Grouping.Day,
        'Day of Week': Grouping.DayOfWeek,
        Week: Grouping.Week,
        Month: Grouping.Month,
        Year: Grouping.Year
    };

    let selectedBucket = initialBucket(days);
    let chartData: StatsData | null = null;

    onMount(async () => {
        void changeChartGrouping(selectedBucket);
    });
</script>

<!--
    the styling for the chart uses variables in the config which depend on the theme
    but do not get updated when the theme changes - i.e. they get the values
    from the theme when they are rendered - we need to manually update when the theme
    changes or the chart colours will not update
-->
{#key $theme}
    {#if chartData}
        <div class="pt-4 pb-4">
            <div class="h-[350px] overflow-x-auto md:px-4 w-fit max-w-full" style="direction: rtl">
                <div
                    class="h-full min-w-10 px-2 pb-4"
                    style="width: {Math.max(chartData.labels.length * 25 + 30, 350)}px"
                >
                    <Line
                        data={{
                            labels: chartData.labels,
                            datasets: [
                                {
                                    backgroundColor: cssVarValue('--primary'),
                                    borderColor: cssVarValue('--primary'),
                                    borderWidth: 1,
                                    yAxisID: 'y-left',
                                    data: chartData.values[By.Entries],
                                    label: 'Entries'
                                },
                                {
                                    backgroundColor: cssVarValue('--secondary'),
                                    borderColor: cssVarValue('--secondary'),
                                    borderWidth: 1,
                                    yAxisID: 'y-right',
                                    data: chartData.values[By.Words],
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
                        onChange={key => changeChartGrouping(key)}
                        key={selectedBucket}
                        options={selectGroupingOptions}
                    />
                </span>
            </div>
        </div>
    {/if}
{/key}
