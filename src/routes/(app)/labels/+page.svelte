<script lang="ts">
    import type { PageData } from './$types';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { nowUtc } from '$lib/utils/time';
    import { listen } from '$lib/dataChangeEvents';
    import LabelOptions from './LabelOptions.svelte';
    import { omit } from '$lib/utils';

    export let data: PageData;

    let { labels } = data;

    $: labelsList = Object.values(labels);

    async function newLabel() {
        let name = 'New Label';
        let i = 0;
        while (labelsList.some(l => l.name === name)) {
            name = `New Label ${++i}`;
        }

        const newLabelData = {
            name,
            color: '#000'
        };

        const { id } = notify.onErr(await api.post('/labels', newLabelData));

        const newLabel = {
            ...newLabelData,
            id,
            created: nowUtc(),
            entryCount: 0,
            eventCount: 0
        };
        labelsList = [...labelsList, newLabel];
        labels[id] = newLabel;
    }

    listen.label.onDelete(id => {
        delete labels[id];
    });
</script>

<svelte:head>
    <title>Labels</title>
</svelte:head>

<main class="md:p-4 md:pl-4 flex-center">
    <div class="w-full md:max-w-5xl">
        <button class="ml-2 mb-4 primary flex-center gap-1" on:click={newLabel}>
            <Plus size="30" />
            New Label
        </button>
        <div class="w-fit">
            {#each labelsList as label}
                <LabelOptions {...omit(label, 'created')} />
                <hr />
            {/each}
        </div>
    </div>
</main>
