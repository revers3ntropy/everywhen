<script lang="ts">
    import EmoticonOutline from 'svelte-material-icons/EmoticonOutline.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import { notify } from '$lib/components/notifications/notifications';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import HappinessValueIcon from '$lib/components/dataset/HappinessValueIcon.svelte';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import { datasetPresets } from '$lib/controllers/dataset/presets';
    import Check from 'svelte-material-icons/Check.svelte';

    export let dataset: Dataset | null;

    async function submit(value: number) {
        if (submitted) return;
        submitted = true;

        if (!dataset) {
            const id = await makeFromPreset();
            dataset = {
                id,
                name: datasetPresets.happiness.defaultName,
                created: nowUtc(),
                preset: datasetPresets.happiness
            };
        }

        const newRow = {
            elements: [value],
            created: nowUtc(),
            timestamp: nowUtc(),
            timestampTzOffset: currentTzOffset()
        };
        notify.onErr(
            await api.post(apiPath('/datasets/?', dataset.id), {
                rows: [newRow]
            })
        );

        notify.success('Happiness entered');
    }

    async function makeFromPreset(): Promise<string> {
        return notify.onErr(
            await api.post('/datasets', {
                name: datasetPresets.happiness.defaultName,
                presetId: 'happiness'
            })
        ).id;
    }

    let submitted = false;
</script>

{#if submitted}
    <div class="bg-vLightAccent rounded-full w-fit p-1 relative">
        <EmoticonOutline size={32} />
        <div class="absolute" style="bottom: -1px; left: 26px">
            <Check size={20} />
        </div>
    </div>
{:else}
    <Dropdown>
        <div slot="button" class="bg-vLightAccent rounded-full w-fit p-1 hover:bg-lightAccent">
            <EmoticonOutline size={32} />
            <div class="absolute" style="bottom: -1px; left: 26px">
                <Plus size={20} />
            </div>
        </div>
        <div class="flex-center gap-2 p-4">
            <button on:click={() => submit(0)}>
                <HappinessValueIcon value={0} size={32} />
            </button>
            <button on:click={() => submit(0.25)}>
                <HappinessValueIcon value={0.25} size={32} />
            </button>
            <button on:click={() => submit(0.5)}>
                <HappinessValueIcon value={0.5} size={32} />
            </button>
            <button on:click={() => submit(0.75)}>
                <HappinessValueIcon value={0.75} size={32} />
            </button>
            <button on:click={() => submit(1)}>
                <HappinessValueIcon value={1} size={32} />
            </button>
        </div>
    </Dropdown>
{/if}
