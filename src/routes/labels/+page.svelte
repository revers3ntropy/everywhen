<script lang="ts">
    import { onMount } from 'svelte';
    import type { App } from '../../app';
    import { api } from '../../lib/api/apiQuery';
    import NewLabelForm from '../../lib/components/NewLabelForm.svelte';
    import Label from './Label.svelte';

    export let data: App.PageData;

    let labels = [];

    async function reload () {
        const res = await api.get(data, '/labels');
        labels = res.labels;
    }

    onMount(reload);
</script>

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