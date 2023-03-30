<script lang="ts">
    import { onMount } from 'svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
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
            labels: [ ...data.labels, {
                ...newLabel,
                id,
                created: nowS(),
                entryCount: 0,
                eventCount: 0,
            } ],
        };
    }

    function labelDeleted (id: string) {
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
    <h1>Labels ({data.labels.length})</h1>
    <div class="labels">
        <div class="label-list">
            {#each data.labels as label}
                <LabelOptions
                    {...label}
                    auth={data}
                    on:delete={({ detail }) => labelDeleted(detail.id)}
                />
            {/each}

            {#if data.labels.length === 0}
                <i class="flex-center text-light">No labels yet</i>
            {/if}

            <div class="flex-center">
                <button class="primary" on:click={newLabel}>
                    <Plus size="30" />
                    Add Label
                </button>
            </div>
        </div>
    </div>
</main>

<style lang="less">
    @import '../../styles/variables.less';

    .labels {
        display: grid;
        place-content: center;

        & > * {
            max-width: 50rem;
        }
    }
</style>