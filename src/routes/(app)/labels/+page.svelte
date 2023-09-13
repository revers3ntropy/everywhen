<script lang="ts">
    import { navExpanded } from '$lib/stores';
    import type { PageData } from './$types';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { nowUtc } from '$lib/utils/time';
    import { listen } from '$lib/dataChangeEvents';
    import LabelOptions from './LabelOptions.svelte';

    export let data: PageData;

    let { labels } = data;

    async function newLabel() {
        let name = 'New Label';
        let i = 0;
        while (labels.some(l => l.name === name)) {
            name = `New Label ${++i}`;
        }

        const newLabel = {
            name,
            color: '#000'
        };

        const { id } = notify.onErr(await api.post('/labels', newLabel));

        labels = [
            ...labels,
            {
                ...newLabel,
                id,
                created: nowUtc(),
                entryCount: 0,
                eventCount: 0
            }
        ];
    }

    listen.label.onDelete(id => {
        labels = labels.filter(l => l.id !== id);
    });
</script>

<svelte:head>
    <title>Labels</title>
</svelte:head>

<main class={$navExpanded ? 'md:ml-48' : 'md:ml-16'}>
    <div class="labels">
        <div class="label-list">
            {#each labels as label}
                <LabelOptions {...label} />
            {/each}

            <div class="flex-center">
                <button class="primary with-icon" on:click={newLabel}>
                    <Plus size="30" />
                    New Label
                </button>
            </div>
        </div>
    </div>
</main>

<style lang="scss">
    .labels {
        display: grid;
        place-content: center;

        & > * {
            max-width: 50rem;
        }
    }
</style>
