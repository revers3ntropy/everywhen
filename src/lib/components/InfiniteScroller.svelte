<script lang="ts">
    import { onDestroy } from 'svelte';
    import { inview } from 'svelte-inview';

    export let hasMore: () => boolean;
    export let loadItems: () => Promise<void>;

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
    style="height: 1px; position: relative; top: -1px"
    use:inview={{}}
    on:inview_enter={load}
    on:inview_leave={() => (pageEndInView = false)}
/>
