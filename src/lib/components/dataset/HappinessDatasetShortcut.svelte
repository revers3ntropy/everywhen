<script lang="ts">
    import { settingsStore } from '$lib/stores';
    import EmoticonOutline from 'svelte-material-icons/EmoticonOutline.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import { notify } from '$lib/components/notifications/notifications';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import HappinessValueIcon from '$lib/components/dataset/HappinessValueIcon.svelte';
    import { datasetPresets } from '$lib/controllers/dataset/presets';
    import * as Popover from '$lib/components/ui/popover';

    export let dataset: Dataset | null;

    async function submit(value: number) {
        if (submitted !== null) return;
        submitted = value;

        if (!dataset) {
            // happiness dataset does not exist yet, so make it
            const id = await makeFromPreset();
            dataset = {
                id,
                name: datasetPresets.happiness.defaultName,
                created: nowUtc(),
                preset: datasetPresets.happiness,
                rowCount: 0
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

    let submitted: number | null = null;
</script>

{#if submitted}
    <HappinessValueIcon value={submitted} size={24} />
{:else}
    <Popover.Root>
        <Popover.Trigger class="static">
            <EmoticonOutline size={24} />

            <div class="relative text-light top-0 left-0" style="transform: translate(10px, -10px)">
                <Plus size={16} />
            </div>
        </Popover.Trigger>
        <Popover.Content class="flex-center gap-2 p-4 w-fit">
            {#if $settingsStore.happinessInputStyle.value === 'likert'}
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
            {:else if $settingsStore.happinessInputStyle.value === 'scale'}
                <div class="flex flex-col gap-2">
                    {#each [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0] as value}
                        <button
                            on:click={() => submit(value)}
                            class="border border-borderLight border-solid rounded-full aspect-square flex-center p-1"
                        >
                            {value * 10}
                        </button>
                    {/each}
                </div>
            {/if}
        </Popover.Content>
    </Popover.Root>
{/if}
