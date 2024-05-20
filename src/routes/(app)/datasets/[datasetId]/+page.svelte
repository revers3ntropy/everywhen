<script lang="ts">
    import { goto } from '$app/navigation';
    import { notify } from '$lib/components/notifications/notifications';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
    import type { PageData } from './$types';
    import DatasetChart from './DatasetChart.svelte';

    export let data: PageData;

    let name = '?';
    $: if (data.dataset) {
        name = data.dataset?.name;
    }
    let nameInp: HTMLInputElement;

    async function updateName() {
        if (!data.dataset) return;
        name = nameInp.value;
        await api.put(apiPath(`/datasets/?`, data.dataset.id), { name });
    }

    async function deleteDataset() {
        if (!data.dataset) return;
        if (!confirm('Are you sure you want to delete this dataset?')) return;
        notify.onErr(await api.delete(apiPath(`/datasets/?`, data.dataset.id)));
        await goto('/datasets');
    }
</script>

<svelte:head>
    <title>{name || 'Unknown'} | View Dataset</title>
</svelte:head>

<main class="md:p-4 md:ml-[10.5rem]">
    <div class="pb-4 flex flex-row justify-between">
        <div>
            <input bind:this={nameInp} value={name} on:change={updateName} />
        </div>
        <div>
            <button on:click={deleteDataset} class="flex-center gap-2">
                <DeleteOutline size="25" /> Delete Dataset
            </button>
        </div>
    </div>

    <section>
        {#if data.dataset}
            <DatasetChart dataset={data.dataset} />
        {/if}
    </section>
</main>
