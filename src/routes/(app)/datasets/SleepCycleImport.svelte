<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import { getFileContents } from '$lib/utils/files.client';
    import type { ChangeEventHandler } from 'svelte/elements';
    import { importFromSleepCycle, makeFromPreset } from './importHelpers';

    export let datasets: Dataset[];
    export let usedPresetIds: string[];
    export let className: string;

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
        const file = files[0];
        const csv = notify.onErr(await getFileContents(file, 'UTF-8'));
        notify.onErr(await importFromSleepCycle(csv, sleepCycleDatasetId));
        notify.success('Sleep Cycle data imported successfully');
    }) as ChangeEventHandler<HTMLInputElement>;

    async function uploadFromSleepCycle() {
        if (!usedPresetIds.includes('sleep')) {
            sleepCycleDatasetId = notify.onErr(await makeFromPreset('sleep'));
        } else {
            sleepCycleDatasetId = datasets.find(({ preset }) => preset?.id === 'sleep')?.id || '';
            if (!sleepCycleDatasetId) {
                notify.error('Could not find Sleep dataset, try refreshing the page');
                return;
            }
        }
        sleepCycleUploadInput?.click();
    }

    let sleepCycleDatasetId: string;
    let sleepCycleUploadInput: HTMLInputElement;
</script>

<button on:click={uploadFromSleepCycle} class={className}>
    <slot />
</button>

<input
    type="file"
    on:change={sleepCycleUpload}
    bind:this={sleepCycleUploadInput}
    style="display: none"
    accept=".csv"
/>
