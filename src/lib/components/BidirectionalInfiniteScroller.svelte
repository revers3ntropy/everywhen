<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { inview } from 'svelte-inview';

    export let hasMore: (fromTop: boolean) => boolean;
    export let loadItems: (isTop: boolean) => Promise<void>;
    export let topMargin = 1;
    export let bottomMargin = topMargin;

    let pageEndInViewTop = false;
    let pageEndInViewBottom = false;
    let currentlyLoading: false | 'top' | 'bottom' = false;
    let destroyed = false;
    let tryLoadOtherDirectionIfFinished = false;

    async function load(isFromTop: boolean) {
        if (isFromTop) {
            pageEndInViewTop = true;
        } else {
            pageEndInViewBottom = true;
        }
        if (currentlyLoading) {
            if (currentlyLoading !== (isFromTop ? 'top' : 'bottom')) {
                tryLoadOtherDirectionIfFinished = true;
            }
            return;
        }
        if (destroyed || !hasMore(isFromTop)) return;
        currentlyLoading = isFromTop ? 'top' : 'bottom';

        await loadItems(isFromTop);

        setTimeout(() => {
            currentlyLoading = false;
            if (isFromTop ? pageEndInViewTop : pageEndInViewBottom) {
                void load(isFromTop);
            } else if (tryLoadOtherDirectionIfFinished) {
                tryLoadOtherDirectionIfFinished = false;
                void load(!isFromTop);
            }
        }, 10);
    }

    onDestroy(() => {
        destroyed = true;
    });

    onMount(() => {
        tryLoadOtherDirectionIfFinished = true;
        void load(false);
    });
</script>

<div
    style="height: {topMargin * 2}px; position: absolute; top: -{topMargin}px"
    class="absolute left-0 right-0 pointer-events-none"
    use:inview={{}}
    on:inview_enter={() => load(true)}
    on:inview_leave={() => (pageEndInViewTop = false)}
/>

<slot />

<div
    style="height: {bottomMargin * 2}px; position: absolute; bottom: -{bottomMargin}px"
    class="absolute left-0 right-0 pointer-events-none"
    use:inview={{}}
    on:inview_enter={() => load(false)}
    on:inview_leave={() => (pageEndInViewBottom = false)}
/>
