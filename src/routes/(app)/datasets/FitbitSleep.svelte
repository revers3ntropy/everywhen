<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import { getFileContents } from '$lib/utils/files.client';
    import { Result } from '$lib/utils/result';
    import type { ChangeEventHandler } from 'svelte/elements';
    import { importSleepFromFitbit, makeFromPreset } from './importHelpers';
    import { CSLogger } from '$lib/controllers/logs/logger.client';

    export let datasets: Dataset[];
    export let usedPresetIds: string[];
    export let className: string;

    const fitbitUpload = (async e => {
        if (!e.target || !('files' in e.target)) {
            return;
        }
        const files = e.target.files as FileList;
        if (files.length < 1) return;
        const jsons = notify.onErr(
            await Result.collectAsync(
                [...files].map(async file => await getFileContents(file, 'UTF-8'))
            )
        );
        notify.onErr(await importSleepFromFitbit(jsons, sleepDatasetId));
        notify.success('Fitbit sleep data imported successfully');
    }) as ChangeEventHandler<HTMLInputElement>;

    async function uploadSleepFromFitbit() {
        if (!usedPresetIds.includes('sleep')) {
            sleepDatasetId = notify.onErr(await makeFromPreset('sleep'));
        } else {
            sleepDatasetId = datasets.find(({ preset }) => preset?.id === 'sleep')?.id || '';
            if (!sleepDatasetId) {
                void CSLogger.error('no Sleep dataset found', {
                    usedPresetIds,
                    sleepDatasetId,
                    datasets
                });
                notify.error('Could not find Sleep dataset, try refreshing the page');
                return;
            }
        }
        fitbitSleepUploadInput?.click();
    }

    let sleepDatasetId: string;
    let fitbitSleepUploadInput: HTMLInputElement;
</script>

<button on:click={uploadSleepFromFitbit} class={className}>
    <slot />
</button>

<input
    type="file"
    multiple
    on:change={fitbitUpload}
    bind:this={fitbitSleepUploadInput}
    style="display: none"
    accept=".json"
/>
