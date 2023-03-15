<script lang="ts">
    import { onMount } from 'svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
    import { api } from '../../lib/api/apiQuery';
    import NewLabelForm from '../../lib/components/NewLabelForm.svelte';
    import { displayNotifOnErr } from '../../lib/utils';
    import Label from './Label.svelte';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData;

    let labels: Label[] = [];

    async function reload () {
        const res = displayNotifOnErr(addNotification,
            await api.get(data, '/labels'),
        );
        labels = res.labels;
    }

    onMount(reload);
</script>

<svelte:head>
    <title>Labels</title>
    <meta content="Labels" name="description" />
</svelte:head>

<main>
    <div class="labels">
        <NewLabelForm auth={data} on:submit={reload} />
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
        </div>
    </div>
</main>

<style lang="less">
    @import '../../styles/variables.less';

    .labels {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 1rem;

        @media @mobile {
            grid-template-columns: 1fr;
        }
    }
</style>