<script lang="ts">
    export let title;
    export let entry;
    export let created;
    export let label = null;
</script>
<main>
    <h3>{title}</h3>
    {@html entry}
</main>
<style lang="less">
    main {
        padding: 1em;
        border: 1px solid #ccc;
        border-radius: 3px;
        margin: 1em 0;
    }
</style>