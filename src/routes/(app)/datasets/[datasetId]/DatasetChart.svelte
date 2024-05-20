<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import Select from '$lib/components/Select.svelte';
    import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
    import type { DatasetMetadata, DatasetRow } from '$lib/controllers/dataset/dataset';
    import { api, apiPath } from '$lib/utils/apiRequest';
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
    import { onMount } from 'svelte';

    import { Line } from 'svelte-chartjs';
    import {
        generateChartData,
        bucketNames,
        initialBucket,
        initialBucketName,
        ReductionStrategy,
        reductionStrategyNames
    } from './generateChartData';

    export let dataset: DatasetMetadata;

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

    async function retrieveData() {
        const { rows } = notify.onErr(await api.get(apiPath('/datasets/?', dataset.id)));
        datasetRows = rows;
    }

    function calculateDaysDatasetCovers(rows: DatasetRow[]): number {
        if (!rows.length) return 0;

        const [min, max] = datasetRows.reduce(
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

    onMount(async () => {
        await retrieveData();
    });
    let datasetRows: DatasetRow[] = [];
    $: days = calculateDaysDatasetCovers(datasetRows);
    $: selectedBucket = initialBucket(days);
    let selectedColumnIdx = 0;
    let selectedReductionStrategy = ReductionStrategy.Mean;

    // only allow numeric columns to be selected
    // TODO remove this constraint
    $: numericColumns = dataset.columns.filter(col =>
        [builtInTypes.number.id, builtInTypes.nullableNumber.id].includes(col.type.id)
    );

    $: graphData = generateChartData(
        datasetRows as DatasetRow<(number | null)[]>[],
        selectedBucket,
        selectedColumnIdx,
        selectedReductionStrategy
    );
</script>

<div style="height: 70vh" class="">
    <div class="flex gap-4 py-4">
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
        <div class="rounded-full bg-vLightAccent py-2 px-4 flex-center gap-2">
            {#if numericColumns.length === 0}
                <span class="text-light"> [No columns] </span>
            {:else if numericColumns.length === 1}
                <span class=""> {dataset.columns[0].name} </span>
            {:else}
                <Select
                    bind:value={selectedColumnIdx}
                    key={'0'}
                    options={Object.fromEntries(
                        numericColumns.map((column, idx) => [column.name, idx])
                    )}
                />
            {/if}
            <span class="text-light"> against </span>
            Time
        </div>
    </div>
    {#if graphData}
        <Line data={graphData} options={options()} />
    {/if}
</div>
