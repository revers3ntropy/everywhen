<script lang="ts">
    import { onMount } from 'svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
    import type { Label as LabelController } from '../../lib/controllers/label';
    import { api } from '../../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../../lib/utils/notifications';
    import { nowS } from '../../lib/utils/time';
    import Label from './Label.svelte';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData;

    let labels: LabelController[] = [];

    async function reload () {
        const res = displayNotifOnErr(addNotification,
            await api.get(data, '/labels'),
        );

        labels = res.labels;
    }

    async function newLabel () {
        let name = 'New Label';
        let i = 0;
        while (labels.some(l => l.name === name)) {
            name = `New Label ${++i}`;
        }

        const newLabel = {
            name,
            colour: '#000',
        };
        const { id } = displayNotifOnErr(addNotification,
            await api.post(data, '/labels', newLabel),
        );

        labels = [ ...labels, {
            ...newLabel,
            id,
            created: nowS(),
        } ];
    }

    onMount(reload);

    onMount(() => document.title = 'Labels');

</script>

<svelte:head>
    <title>Labels</title>
    <meta content="Labels" name="description" />
</svelte:head>

<main>
    <h1>Labels ({labels.length})</h1>
    <div class="labels">
        <div class="label-list">
            {#each labels as label}
                <Label
                    {...label}
                    auth={data}
                    on:updated={reload}
                />
            {/each}

            {#if labels.length === 0}
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