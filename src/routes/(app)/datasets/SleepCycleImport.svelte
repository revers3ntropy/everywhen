<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { getFileContents } from '$lib/utils/files.client';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import type { ChangeEventHandler } from 'svelte/elements';
    import { makeFromPreset } from './importHelpers';

    export let datasets: Dataset[];
    export let usedPresetIds: string[];

    const sleepCycleUpload = (async e => {
        if (!e.target || !('files' in e.target)) {
            return;
        }
        const files = e.target.files as FileList;
        if (files.length < 1) return;
        if (files.length !== 1) {
            notify.error('Only one file can be uploaded at a time');
            return;
        }
        const [file] = files;
        const csv = notify.onErr(await getFileContents(file, 'UTF-8'));
        const lines = csv.split('\n');
        const [header, ...dataLines] = lines;

        const columns = header.split(',');
        const startTsIdx = columns.indexOf('Start');
        const endTsIdx = columns.indexOf('End');
        const sleepQualityIdx = columns.indexOf('Sleep Quality');
        const regularityIdx = columns.indexOf('Regularity');

        const rows = [];

        for (const lines of dataLines) {
            const linesParts = lines.split(',');
            const startTs = linesParts[startTsIdx];
            const endTs = linesParts[endTsIdx];

            let sleepQuality: number | null = parseFloat(linesParts[sleepQualityIdx]) / 100;
            if (isNaN(sleepQuality)) sleepQuality = null;
            let regularity: number | null = parseFloat(linesParts[regularityIdx]) / 100;
            if (isNaN(regularity)) regularity = null;

            const start = new Date(startTs);
            const end = new Date(endTs);
            const duration = (end.getTime() - start.getTime()) / 1000;

            rows.push({
                elements: [duration, sleepQuality, regularity],
                created: nowUtc(),
                timestamp: start.getTime() / 1000,
                timestampTzOffset: currentTzOffset()
            });
        }

        notify.onErr(
            await api.post(apiPath('/datasets/?', sleepCycleDatasetId), {
                rows,
                onSameTimestamp: 'skip'
            })
        );
    }) as ChangeEventHandler<HTMLInputElement>;

    async function uploadFromSleepCycle() {
        if (!usedPresetIds.includes('sleepCycle')) {
            sleepCycleDatasetId = await makeFromPreset('sleepCycle');
        } else {
            sleepCycleDatasetId =
                datasets.find(({ preset }) => preset?.id === 'sleepCycle')?.id || '';
            if (!sleepCycleDatasetId) {
                notify.error('Could not find Sleep Cycle dataset, try refreshing the page');
                return;
            }
        }
        sleepCycleUploadInput?.click();
    }

    let sleepCycleDatasetId: string;
    let sleepCycleUploadInput: HTMLInputElement;
</script>

<button on:click={uploadFromSleepCycle}>Import from Sleep Cycle</button>

<input
    type="file"
    on:change={sleepCycleUpload}
    bind:this={sleepCycleUploadInput}
    style="display: none"
    accept=".csv"
/>
