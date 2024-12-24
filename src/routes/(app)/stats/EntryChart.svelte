<script lang="ts">
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
    import { Line } from 'svelte-chartjs';
    import Select from '$lib/components/Select.svelte';
    import { By } from './helpers';
    import { Bucket } from './helpers';
    import { cssVarValue } from '$lib/utils/getCssVar';

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

    export let timeOfDayData: Record<By, { timeOfDay: number; value: number }[]>;
    export let bucketisedData: {
        [key in Bucket]?: Record<By, number[]>;
    };
    export let days: number;
    export let earliestEntryDay: Day;

    export function initialBucket(days: number): Bucket & keyof typeof bucketisedData {
        if (days < 7 + 3 && bucketisedData[Bucket.Day]) return Bucket.Day;
        if (days < 7 * 14 && bucketisedData[Bucket.Week]) return Bucket.Week;
        if (days < 365 * 10 && bucketisedData[Bucket.Month]) return Bucket.Month;
        if (bucketisedData[Bucket.Year]) return Bucket.Year;
        throw new Error('No bucket found');
    }

    export function getLabels(selectedBucket: Bucket, earliestEntryDay: Day): string[] {
        switch (selectedBucket) {
            case Bucket.Year:
                return Array(Day.todayUsingNativeDate().year - earliestEntryDay.year + 1)
                    .fill(0)
                    .map((_, i) => i + earliestEntryDay.year + '');
            case Bucket.Month:
                return Array((Day.todayUsingNativeDate().year - earliestEntryDay.year + 1) * 12)
                    .fill(0)
                    .map((_, i) =>
                        fmtUtc(
                            new Day(
                                Math.floor(earliestEntryDay.year + i / 12),
                                (i % 12) + 1,
                                1
                            ).utcTimestamp(0),
                            0,
                            [0, 11].includes(i % 12) ? 'YYYY MMM' : 'MMM'
                        )
                    );
            default:
                throw new Error('Not implemented');
        }
    }

    let selectedBucket: keyof typeof bucketisedData = initialBucket(days);

    const options = () => ({
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
    });

    $: labels = getLabels(selectedBucket, earliestEntryDay);
</script>

<div class="h-[350px] overflow-x-auto" style="direction: rtl">
    <div class="h-full min-w-10 px-2" style="width: {labels.length * 25}px">
        <Line
            data={{
                labels,
                datasets: [
                    {
                        backgroundColor: cssVarValue('--primary'),
                        borderColor: cssVarValue('--primary'),
                        borderWidth: 1,
                        data: bucketisedData[selectedBucket][By.Entries],
                        label: 'Entries'
                    },
                    {
                        backgroundColor: cssVarValue('--primary-light'),
                        borderColor: cssVarValue('--primary-light'),
                        borderWidth: 1,
                        data: bucketisedData[selectedBucket][By.Words],
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
            bind:value={selectedBucket}
            key={selectedBucket}
            options={{
                Year: Bucket.Year,
                Month: Bucket.Month
            }}
        />
    </span>
</div>

<div class="mt-4 flex justify-between border-t border-borderColor pt-4">
    <div class="flex-1">
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
                            data: timeOfDayData[By.Entries].map(({ value }) => value),
                            label: 'Entries'
                        },
                        {
                            backgroundColor: cssVarValue('--primary-light'),
                            borderColor: cssVarValue('--primary-light'),
                            borderWidth: 1,
                            data: timeOfDayData[By.Words].map(({ value }) => value),
                            label: 'Words'
                        }
                    ]
                }}
                options={options()}
            />
        </div>
    </div>
    <div class="flex-1"> </div>
</div>
