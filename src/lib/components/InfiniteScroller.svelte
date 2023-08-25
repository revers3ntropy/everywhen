<script lang="ts">
    import Spinner from '$lib/components/BookSpinner.svelte';
    import { inview } from 'svelte-inview';

    type Item = NonNullable<unknown>;

    export let showSpinner = true;
    export let margin = '300px';
    export let items = [] as Item[];
    export let batchSize = 10;
    export let numItems: number;

    export let loadItems: (offset: number, count: number) => Promise<Item[]>;

    let pageEndInView = false;
    let currentOffset = items.length;
    let loadingAt = currentOffset as number | null;
    let loadedAny = false;

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
</script>

<slot {items} />

{#if numItems !== 0}
    {#if showSpinner && items.length < numItems}
        <Spinner />
    {/if}
    <div
        style="height: 1px"
        use:inview={{ rootMargin: margin }}
        on:inview_enter={load}
        on:inview_leave={() => (pageEndInView = false)}
    />
{:else}
    Nothing!
    <slot name="empty" />
{/if}
