<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import Select from '$lib/components/Select.svelte';
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
        // fetch data from the server
        const { rows } = notify.onErr(await api.get(apiPath('/datasets/?', dataset.id)));
        datasetRows = rows;
    }

    function arrayDiff(a: [number, number]): number {
        return a[1] - a[0];
    }

    function calculateDaysDatasetCovers(rows: DatasetRow[]): number {
        if (!rows.length) return 0;
        return (
            arrayDiff(
                datasetRows.reduce(
                    (acc, row) => {
                        const rowTime = row.timestamp + row.timestampTzOffset * 60 * 60;
                        if (acc[0] > rowTime) acc[0] = rowTime;
                        if (acc[1] < rowTime) acc[1] = rowTime;
                        return acc;
                    },
                    [Infinity, -Infinity]
                )
            ) /
            (60 * 60 * 24)
        );
    }

    onMount(async () => {
        await retrieveData();
    });
    let datasetRows: DatasetRow[] = [];
    $: days = calculateDaysDatasetCovers(datasetRows);
    $: selectedBucket = initialBucket(days);
    let selectedColumnIdx = 0;
    let selectedReductionStrategy = ReductionStrategy.Mean;

    $: graphData = generateChartData(
        datasetRows,
        selectedBucket,
        selectedColumnIdx,
        selectedReductionStrategy
    );
</script>

<div style="height: 70vh" class="">
    <div class="flex gap-4 py-4">
        <div class="rounded-full bg-vLightAccent py-2 px-4">
            <span class="text-light pr-2"> Group by </span>
            <Select
                bind:value={selectedBucket}
                key={initialBucketName(days)}
                options={bucketNames}
            />
        </div>
        <div class="rounded-full bg-vLightAccent py-2 px-4">
            <span class="text-light pr-2"> Reduce by </span>
            <Select
                bind:value={selectedReductionStrategy}
                key={ReductionStrategy.Mean}
                options={reductionStrategyNames}
            />
        </div>
        <div class="rounded-full bg-vLightAccent py-2 px-4">
            <Select
                bind:value={selectedColumnIdx}
                key={'0'}
                options={Object.fromEntries(
                    dataset.columns.map((column, idx) => [column.name, idx])
                )}
            />
            <span class="text-light px-2"> against </span>
            Time
        </div>
    </div>
    {#if graphData}
        <Line data={graphData} options={options()} />
    {/if}
</div>
