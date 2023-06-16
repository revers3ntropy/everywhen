<script lang="ts">
    import Reload from 'svelte-material-icons/Reload.svelte';

    export let newVersion: string;
</script>

<div class="outer">
    <button class="inner" on:click={() => location.reload()}>
        <span
            >A new version ({newVersion}) is available! Click to apply the
            update
        </span>
        <Reload size="40" />
    </button>
</div>

<style lang="less">
    @import '../styles/layout';
    @import '../styles/variables';

    .outer {
        position: fixed;
        bottom: 0;
        left: 0;
        z-index: 2000;
        padding: 1rem;

        .inner {
            .flex-center();
            background: var(--light-accent);
            border: 1px solid var(--primary);
            padding: 1rem;
            font-size: 1.05rem;
            border-radius: @border-radius;

            span {
                margin: 0 1rem 0 0;
            }
        }
    }
</style>
