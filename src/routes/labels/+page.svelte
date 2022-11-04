<script lang="ts">
    import { api } from "$lib/api/apiQuery";
    import type { Auth } from "$lib/types";
    import Label from "./Label.svelte";
    import NewLabelForm from "$lib/components/NewLabelForm.svelte";

    export let data: Auth;

    let labels = [];

    async function reload () {
        const res = await api.get(data, "/labels");
        labels = res.labels;
    }

    reload();
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