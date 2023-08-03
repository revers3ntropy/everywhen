<script lang="ts">
    import type { PageData } from './$types';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import { nowUtc } from '$lib/utils/time';
    import { listen } from '$lib/dataChangeEvents';
    import Dot from '$lib/components/Dot.svelte';
    import LabelOptions from './LabelOptions.svelte';

    export let data: PageData;

    async function newLabel() {
        let name = 'New Label';
        let i = 0;
        while (data.labels.some(l => l.name === name)) {
            name = `New Label ${++i}`;
        }

        const newLabel = {
            name,
            color: '#000'
        };

        const { id } = displayNotifOnErr(await api.post(data.auth, '/labels', newLabel));

        data = {
            ...data,
            labels: [
                ...data.labels,
                {
                    ...newLabel,
                    id,
                    created: nowUtc(),
                    entryCount: 0,
                    eventCount: 0
                }
            ]
        };
    }

    listen.label.onDelete(id => {
        data = {
            ...data,
            labels: data.labels.filter(l => l.id !== id)
        };
    });
</script>

<svelte:head>
    <title>Labels</title>
</svelte:head>

<main>
    <h1>
        <LabelOutline size="40" />
        <span>Labels</span>
        {#if data.labels.length > 0}
            <Dot />
            {data.labels.length}
        {/if}
    </h1>
    <div class="labels">
        <div class="label-list">
            {#each data.labels as label}
                <LabelOptions {...label} auth={data.auth} />
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

<style lang="less">
    @import '../../../styles/layout';
    @import '../../../styles/variables';

    h1 {
        .flex-center();
        margin: 0 0 1rem 0;
        font-size: 40px;

        i {
            font-size: 0.5em;
            margin-left: 0.5em;
        }

        span {
            margin-left: 0.2em;
        }
    }

    .labels {
        display: grid;
        place-content: center;

        & > * {
            max-width: 50rem;
        }
    }
</style>
