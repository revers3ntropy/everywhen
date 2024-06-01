<script lang="ts">
    import { goto } from '$app/navigation';
    import { notify } from '$lib/components/notifications/notifications';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
    import TuneVariant from 'svelte-material-icons/TuneVariant.svelte';
    import type { PageData } from './$types';
    import DatasetChart from './DatasetChart.svelte';

    export let data: PageData;

    let nameInp: HTMLInputElement;

    async function updateName() {
        data.dataset.name = nameInp.value;
        await api.put(apiPath(`/datasets/?`, data.dataset.id), { name: data.dataset.name });
    }

    async function deleteDataset() {
        if (!confirm('Are you sure you want to delete this dataset?')) return;
        notify.onErr(await api.delete(apiPath(`/datasets/?`, data.dataset.id)));
        await goto('/datasets');
    }

    async function addColumn() {
        const newColumn = notify.onErr(
            await api.post(apiPath(`/datasets/?/columns`, data.dataset.id), {
                name: 'New Column',
                type: 'number'
            })
        );
        data.dataset.columns.push(newColumn);
    }
</script>

<svelte:head>
    <title>{data.dataset.name || 'Unknown'} | View Dataset</title>
</svelte:head>

<main class="md:p-4 md:ml-[10.5rem]">
    <div class="pb-4 flex flex-row justify-between">
        <div class="text-lg">
            <input bind:this={nameInp} value={data.dataset.name} on:change={updateName} />
        </div>
        <div>
            <button
                on:click={deleteDataset}
                class="flex-center gap-2 danger border border-solid border-borderColor py-2 px-4 hover:bg-vLightAccent rounded-full"
            >
                <DeleteOutline size="25" /> Delete Dataset
            </button>
        </div>
    </div>

    {#if data.dataset?.preset}
        <div class="flex justify-start items-center gap-2">
            <TuneVariant size="20" />
            <span class="text-light"> From preset '{data.dataset.preset.defaultName}' </span>
        </div>
    {/if}

    <section>
        {#if data.dataset && data.dataset.columns.length}
            <DatasetChart dataset={data.dataset} />
        {/if}
    </section>

    <section class="pt-8">
        <div class="flex">
            <table class="border-borderColor border border-r-0">
                <tr>
                    <th class="p-2 border-r border-borderColor"> Timestamp </th>
                    {#each data.dataset?.columns as column}
                        <th class="p-2 border-r border-borderColor">
                            <div class="pb-2">
                                {column.name}
                            </div>
                            <div class="bg-lightAccent rounded-full p-1">
                                {column.type.name}
                            </div>
                        </th>
                    {/each}
                </tr>
            </table>

            {#if !data.dataset.preset}
                <button
                    class="border border-solid border-borderColor border-l-0 p-2 bg-vLightAccent hover:bg-lightAccent"
                    on:click={addColumn}
                >
                    +
                </button>
            {/if}
        </div>
    </section>
</main>
