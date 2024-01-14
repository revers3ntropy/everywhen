<script lang="ts">
    import { onDestroy } from 'svelte';
    import { inview } from 'svelte-inview';

    export let hasMore: () => boolean;
    export let loadItems: () => Promise<void>;
    export let margin = 1;
    export let marginBelow = 1;

    let pageEndInView = false;
    let currentlyLoading = false;
    let destroyed = false;

    async function load() {
        pageEndInView = true;
        if (destroyed || currentlyLoading || !hasMore()) return;
        currentlyLoading = true;

        await loadItems();

        setTimeout(() => {
            currentlyLoading = false;
            if (pageEndInView) {
                void load();
            }
        }, 10);
    }

    onDestroy(() => {
        destroyed = true;
    });
</script>

<slot />

<div
    style="height: {margin + marginBelow}px; position: absolute; bottom: -{marginBelow}px"
    class="absolute left-0 right-0 pointer-events-none"
    use:inview={{}}
    on:inview_enter={load}
    on:inview_leave={() => (pageEndInView = false)}
/>
