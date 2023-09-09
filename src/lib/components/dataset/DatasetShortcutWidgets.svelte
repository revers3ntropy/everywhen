<script lang="ts">
    import type { Dataset, DatasetMetadata } from '$lib/controllers/dataset/dataset';
    import type { PresetId } from '$lib/controllers/dataset/presets';
    import WeightDatasetShortcut from './WeightDatasetShortcut.svelte';

    export let datasets: DatasetMetadata[];

    $: datasetsByPresetId = datasets.reduce(
        (acc, dataset) => {
            if (dataset.preset) {
                acc[dataset.preset.id as PresetId] = dataset;
            }
            return acc;
        },
        {} as Record<PresetId, Dataset>
    );
</script>

<div class="wrapper">
    <WeightDatasetShortcut dataset={datasetsByPresetId['weight'] || null} />
</div>

<style lang="scss">
    .wrapper {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: flex-start;
    }
</style>
