<script lang="ts">
    import Spinner from '$lib/components/BookSpinner.svelte';
    import { inview } from 'svelte-inview';

    type Item = NonNullable<unknown>;

    export let showSpinner = true;
    export let initialMargin = 0;
    export let maxMargin = 300;
    export let minItemsHeight: number;
    export let items = [] as Item[];
    export let batchSize = 10;
    export let numItems: number;

    export let loadItems: (offset: number, count: number) => Promise<Item[]>;

    let pageEndInView = false;
    let currentOffset = items.length;
    let loadingAt = currentOffset as number | null;
    let loadedAny = false;

    let margin = initialMargin;

    async function load() {
        pageEndInView = true;
        let offset = currentOffset;
        if (loadingAt === offset && loadedAny) {
            return;
        }
        loadingAt = offset;

        if (loadingAt >= numItems && loadedAny) {
            return;
        }

        loadedAny = true;

        const newItems = await loadItems(offset, batchSize);

        currentOffset += newItems.length;
        items = [...items, ...newItems];

        if (loadingAt === offset) {
            loadingAt = null;
        }

        if (pageEndInView) {
            void load();
        }
    }

    $: if (!pageEndInView && margin < maxMargin) {
        margin += minItemsHeight;
    }
</script>

<slot {items} />

{#if numItems > 0}
    {#key margin}
        <div
            style="height: 1px; position: relative; top: -{margin}px"
            use:inview={{}}
            on:inview_enter={load}
            on:inview_leave={() => (pageEndInView = false)}
        />
    {/key}
    {#if showSpinner && items.length < numItems}
        <Spinner />
    {/if}
{:else}
    <slot name="empty" />
{/if}
