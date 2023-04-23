<script lang="ts">
    import { onMount } from 'svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import Dot from '../../lib/components/Dot.svelte';
    import type { Label as LabelController } from '../../lib/controllers/label';
    import { api } from '../../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../../lib/utils/notifications';
    import { nowS } from '../../lib/utils/time';
    import LabelOptions from './LabelOptions.svelte';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData & {
        labels: (LabelController & {
            entryCount: number;
            eventCount: number;
        })[];
    };

    async function newLabel () {
        let name = 'New Label';
        let i = 0;
        while (data.labels.some(l => l.name === name)) {
            name = `New Label ${++i}`;
        }

        const newLabel = {
            name,
            colour: '#000',
        };

        const { id } = displayNotifOnErr(addNotification,
            await api.post(data, '/labels', newLabel),
        );

        data = {
            ...data,
            labels: [
                ...data.labels,
                {
                    ...newLabel,
                    id,
                    created: nowS(),
                    entryCount: 0,
                    eventCount: 0,
                },
            ],
        };
    }

    function labelDeleted ({ detail: { id } }: { detail: { id: string } }) {
        data = {
            ...data,
            labels: data.labels.filter(l => l.id !== id),
        };
    }

    onMount(() => document.title = 'Labels');

</script>

<svelte:head>
    <title>Labels</title>
    <meta content="Labels" name="description" />
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
                <LabelOptions
                    {...label}
                    auth={data}
                    on:delete={labelDeleted}
                />
            {/each}

            {#if data.labels.length === 0}
                <i class="flex-center text-light">No labels yet</i>
            {/if}

            <div class="flex-center">
                <button
                    class="primary with-icon"
                    on:click={newLabel}
                >
                    <Plus size="30" />
                    Create Label
                </button>
            </div>
        </div>
    </div>
</main>

<style lang="less">
    @import '../../styles/layout';
    @import '../../styles/variables';

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