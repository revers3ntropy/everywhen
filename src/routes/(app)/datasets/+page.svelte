<script lang="ts">
    import type { PageData } from './$types';

    export let data: PageData;
</script>

<svelte:head>
    <title> Datasets </title>
</svelte:head>

<main>
    Datasets

    {#each data.datasets as dataset}
        <div>
            {dataset.name}
        </div>
    {/each}
</main>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';

</style>
