<script lang="ts">
    import { onMount } from 'svelte';
    import { inview } from 'svelte-inview';

    export let hasMore: () => boolean;
    export let loadItems: () => Promise<void>;
    export let invertDirection = false;

    let pageEndInView = false;
    let currentlyLoading = false;

    async function load() {
        pageEndInView = true;
        if (currentlyLoading || !hasMore()) return;
        currentlyLoading = true;

        await loadItems();

        setTimeout(() => {
            currentlyLoading = false;
            if (pageEndInView) {
                void load();
            }
        }, 10);
    }

    onMount(() => {
        if (invertDirection) {
            let scrollContainer = document.getElementsByClassName('root')[0]! as HTMLDivElement;
            let scrollFromBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop;
            const observer = new MutationObserver(mutationsList => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        scrollContainer.scrollTo(
                            0,
                            scrollContainer.scrollHeight - scrollFromBottom
                        );
                    }
                }
            });
            observer.observe(containerEl, { childList: true });
            scrollContainer.onscroll = () => {
                scrollFromBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop;
            };
        }
    });

    let containerEl: HTMLDivElement;
</script>

<div bind:this={containerEl} class="flex" class:flex-col-reverse={invertDirection}>
    <slot />

    <div
        style="height: 1px; position: relative; top: -1px"
        use:inview={{}}
        on:inview_enter={load}
        on:inview_leave={() => (pageEndInView = false)}
    />
</div>
