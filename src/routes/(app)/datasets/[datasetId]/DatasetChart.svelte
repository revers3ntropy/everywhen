<script lang="ts">
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
        type ChartOptions,
        type AnimationsSpec
    } from 'chart.js';
    import { Line, Scatter } from 'svelte-chartjs';
    import * as Accordion from '$lib/components/ui/accordion';
    import { Checkbox } from '$lib/components/ui/checkbox/index.js';
    import { Label } from '$lib/components/ui/label';
    import Select from '$lib/components/ui/Select.svelte';
    import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
    import type { DatasetMetadata, DecryptedDatasetRow } from '$lib/controllers/dataset/dataset';
    import { cssVarValue } from '$lib/utils/getCssVar';
    import { undefined } from 'zod';
    import {
        generateChartData,
        bucketNames,
        initialBucket,
        initialBucketName,
        ReductionStrategy,
        reductionStrategyNames,
        type XAxisKey,
        timeIdxKey,
        ChartType,
        DefaultValueStrategy
    } from './generateChartData';
    import { tryDecryptText } from '$lib/utils/encryption.client';
    import EncryptedText from '$lib/components/ui/EncryptedText.svelte';

    export let dataset: DatasetMetadata;
    export let rows: DecryptedDatasetRow[] | null;

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

    let fitScaleToData = false;
    const options = (fitScaleToData: boolean) =>
        ({
            responsive: true,
            // not sure why it doesn't allow false, the types seem to suggest it is allowed
            animations: false as unknown as AnimationsSpec<'line'> & AnimationsSpec<'scatter'>,
            scales: {
                y: {
                    border: { color: cssVarValue('--border-light') },
                    ticks: { color: cssVarValue('--text-color-light') },
                    grid: { display: false },
                    suggestedMin: fitScaleToData ? undefined : 0
                },
                x: {
                    border: { color: cssVarValue('--border-light') },
                    ticks: { color: cssVarValue('--text-color-light') },
                    grid: { display: false }
                }
            }
        }) satisfies ChartOptions;

    function calculateDaysDatasetCovers(rows: DecryptedDatasetRow[] | null): number {
        if (!rows || !rows.length) return 0;

        const [min, max] = rows.reduce(
            (acc, row) => {
                const rowTime = row.timestamp + row.timestampTzOffset * 60 * 60;
                if (acc[0] > rowTime) acc[0] = rowTime;
                if (acc[1] < rowTime) acc[1] = rowTime;
                return acc;
            },
            [Infinity, -Infinity]
        );

        return (max - min) / (60 * 60 * 24);
    }

    $: days = calculateDaysDatasetCovers(rows);
    $: selectedBucket = initialBucket(days);
    let yAxisSelectedColumnIdx = 0;
    let xAxis: XAxisKey = timeIdxKey;
    let selectedReductionStrategy = ReductionStrategy.Mean;
    let defaultValueStrategy = DefaultValueStrategy.Zero;

    // only allow numeric columns to be selected
    // TODO remove this constraint
    $: numericColumns = dataset.columns.filter(col =>
        [builtInTypes.number.id, builtInTypes.nullableNumber.id].includes(col.type.id)
    );

    $: [graphType, graphData] = generateChartData(
        (rows ?? []) as DecryptedDatasetRow<(number | null)[]>[],
        selectedBucket,
        yAxisSelectedColumnIdx,
        xAxis,
        selectedReductionStrategy,
        defaultValueStrategy
    );

    $: yAxisOptions = Object.fromEntries(
        numericColumns.map(column => [tryDecryptText(column.name), column.ordering])
    );

    // TODO do not show the currently selected Y axis column in the X axis options
    $: xAxisOptions = {
        Time: timeIdxKey,
        ...Object.fromEntries(
            numericColumns.map(column => [tryDecryptText(column.name), `col:${column.ordering}`])
        )
    };
</script>

{#if rows && rows.length > 1}
    <div class="py-4">
        <div class="rounded-xl bg-vLightAccent py-2 px-4 flex-center gap-2 w-fit">
            {#if numericColumns.length === 0}
                <span class="text-light"> [No columns] </span>
            {:else if numericColumns.length === 1}
                <span> <EncryptedText text={dataset.columns[0].name} /> </span>
            {:else}
                <Select bind:value={yAxisSelectedColumnIdx} key={'0'} options={yAxisOptions} />
            {/if}
            <span class="text-light"> against </span>
            <Select bind:value={xAxis} key={'col:0'} options={xAxisOptions} />
        </div>
    </div>

    <div>
        <Accordion.Root class="bg-vLightAccent rounded-xl">
            <Accordion.Item value="item-1" class="border-none">
                <Accordion.Trigger
                    class="rounded-xl hover:no-underline hover:bg-lightAccent px-4 text-[1rem]"
                >
                    Chart Options
                </Accordion.Trigger>
                <Accordion.Content>
                    <div class="p-2 md:p-4 flex gap-4">
                        {#if graphType === ChartType.Line}
                            <div
                                class="w-fit rounded-full bg-lightAccent py-2 px-4 flex-center gap-2"
                            >
                                <span class="text-light"> Group by </span>
                                <Select
                                    bind:value={selectedBucket}
                                    key={initialBucketName(days)}
                                    options={bucketNames}
                                />
                            </div>
                            <div
                                class="w-fit rounded-full bg-lightAccent py-2 px-4 flex-center gap-2"
                            >
                                <span class="text-light"> Reduce by </span>
                                <Select
                                    bind:value={selectedReductionStrategy}
                                    key={ReductionStrategy.Mean}
                                    options={reductionStrategyNames}
                                />
                            </div>
                        {/if}
                        <div class="w-fit rounded-full bg-lightAccent py-2 px-4 flex-center gap-2">
                            <Checkbox id="fit-scale-to-data" bind:checked={fitScaleToData} />
                            <Label for="fit-scale-to-data" class="text-light">
                                Fit scale to data
                            </Label>
                        </div>
                        <div class="w-fit rounded-full bg-lightAccent py-2 px-4 flex-center gap-2">
                            <span class="text-light"> Default value</span>
                            <Select
                                bind:key={defaultValueStrategy}
                                options={{ Zero: 'Zero', Previous: 'Previous' }}
                            />
                        </div>
                    </div>
                </Accordion.Content>
            </Accordion.Item>
        </Accordion.Root>
    </div>

    <div class="h-[70vh]">
        {#if graphData}
            {#key [graphData, graphType]}
                {#if graphType === ChartType.Scatter}
                    <Scatter data={graphData} options={options(fitScaleToData)} />
                {:else if graphType === ChartType.Line}
                    <Line data={graphData} options={options(fitScaleToData)} />
                {/if}
            {/key}
        {/if}
    </div>
{/if}
