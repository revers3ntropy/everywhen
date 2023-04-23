<script lang="ts">
    import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
    import ArrowRight from 'svelte-material-icons/ArrowRight.svelte';

    export let page = 0;
    export let pages = 0;
    export let pageLength = 0;
    export let total = 0;
    export let emptyText = '';
</script>

{#if total < 1}
    {emptyText}
{:else}
    <div class="page-counter">
        <div>
            <button
                on:click="{() => page--}"
                disabled="{page <= 0}"
                class="flex-center"
                aria-label="Previous page"
            >
                <ArrowLeft size="20" />
            </button>
        </div>
        <div>
            Page {page + 1} of {pages}
            <span class="totals">
                (showing {Math.min((page + 1) * pageLength, total)} / {total})
            </span>
        </div>
        <div>
            <button
                on:click="{() => page++}"
                disabled="{page >= pages - 1}"
                class="flex-center"
                aria-label="Next page"
            >
                <ArrowRight size="20" />
            </button>
        </div>
    </div>
{/if}

<style lang="less">
    @import '../../styles/variables.less';

    .page-counter {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .totals {
        color: @text-color-light;
    }
</style>
