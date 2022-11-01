<script lang="ts">
    import { api } from "$lib/api/apiQuery";
    import type { Auth } from "$lib/types";
    import Label from "./Label.svelte";

    export let data: Auth;

    let labels = [];

    async function reload () {
        const res = await api.get(data, "/labels")
        labels = res.labels;
    }

    reload();
</script>

<main>
    <h1>Labels</h1>
    <ul>
        {#each labels as label}
            <Label {...label} on:updated={reload} />
        {/each}
    </ul>
</main>

<style lang="less">

</style>