<script lang="ts">
    import { api, apiPath } from '$lib/utils/apiRequest';
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
</script>

<svelte:head>
    <title>{name || 'Unknown'} | View Dataset</title>
</svelte:head>

<main class="md:p-4 md:ml-[10.5rem]">
    <div class="pb-4">
        <input bind:this={nameInp} value={name} on:change={updateName} />
    </div>

    <section>
        {#if data.dataset}
            <DatasetChart dataset={data.dataset} />
        {/if}
    </section>
</main>
