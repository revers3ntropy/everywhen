<script lang="ts">
    export let light = false;
</script>

<span class={light ? 'text-light' : ''}>&#x2022;</span>

<style lang="less">
    span {
        margin: 0 0.2em;
    }
</style>
