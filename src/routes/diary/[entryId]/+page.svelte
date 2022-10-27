<script lang="ts">
    import Entry from "$lib/components/Entry.svelte";

    export let data: Record<string, any>;
</script>
<main>
    <Entry {...data} />
</main>
<style>

</style>