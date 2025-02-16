<script lang="ts">
    import Select from '$lib/components/ui/Select.svelte';
    import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
    import type { DatasetMetadata, DatasetRow } from '$lib/controllers/dataset/dataset';
    import { cssVarValue } from '$lib/utils/getCssVar';
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

    import { Line, Scatter } from 'svelte-chartjs';
    import {
        generateChartData,
        bucketNames,
        initialBucket,
        initialBucketName,
        ReductionStrategy,
        reductionStrategyNames,
        type XAxisKey,
        timeIdxKey,
        ChartType
    } from './generateChartData';

    export let dataset: DatasetMetadata;
    export let rows: DatasetRow[] | null;

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

    const options = () => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                border: { color: cssVarValue('--border-light') },
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

    function calculateDaysDatasetCovers(rows: DatasetRow[] | null): number {
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

    // only allow numeric columns to be selected
    // TODO remove this constraint
    $: numericColumns = dataset.columns.filter(col =>
        [builtInTypes.number.id, builtInTypes.nullableNumber.id].includes(col.type.id)
    );

    $: [graphType, graphData] = generateChartData(
        (rows ?? []) as DatasetRow<(number | null)[]>[],
        selectedBucket,
        yAxisSelectedColumnIdx,
        xAxis,
        selectedReductionStrategy
    );

    $: yAxisOptions = Object.fromEntries(numericColumns.map((column, idx) => [column.name, idx]));

    // TODO do not show the currently selected Y axis column in the X axis options
    $: xAxisOptions = {
        Time: timeIdxKey,
        ...Object.fromEntries(numericColumns.map((column, idx) => [column.name, `col:${idx}`]))
    };
</script>

{#if rows && rows.length > 1}
    <div class="flex gap-1 md:gap-4 py-4 flex-wrap">
        <div class="rounded-full bg-vLightAccent py-2 px-4 flex-center gap-2">
            {#if numericColumns.length === 0}
                <span class="text-light"> [No columns] </span>
            {:else if numericColumns.length === 1}
                <span class=""> {dataset.columns[0].name} </span>
            {:else}
                <Select bind:value={yAxisSelectedColumnIdx} key={'0'} options={yAxisOptions} />
            {/if}
            <span class="text-light"> against </span>
            <Select bind:value={xAxis} key={'col:0'} options={xAxisOptions} />
        </div>
        {#if graphType === ChartType.Line}
            <div class="rounded-full bg-vLightAccent py-2 px-4 flex-center gap-2">
                <span class="text-light"> Group by </span>
                <Select
                    bind:value={selectedBucket}
                    key={initialBucketName(days)}
                    options={bucketNames}
                />
            </div>
            <div class="rounded-full bg-vLightAccent py-2 px-4 flex-center gap-2">
                <span class="text-light"> Reduce by </span>
                <Select
                    bind:value={selectedReductionStrategy}
                    key={ReductionStrategy.Mean}
                    options={reductionStrategyNames}
                />
            </div>
        {/if}
    </div>
    <div class="h-[70vh]">
        {#if graphData}
            {#if graphType === ChartType.Scatter}
                <Scatter data={graphData} options={options()} />
            {:else if graphType === ChartType.Line}
                <Line data={graphData} options={options()} />
            {/if}
        {/if}
    </div>
{/if}
