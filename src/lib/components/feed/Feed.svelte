<script lang="ts">
    import type { Label } from '$lib/controllers/label/label';
    import InfiniteScroller from '$lib/components/InfiniteScroller.svelte';
    import DayInFeed from '$lib/components/feed/DayInFeed.svelte';
    import type { Location } from '$lib/controllers/location/location';
    import type { FeedDay } from '$lib/controllers/feed/feed';
    import { currentTzOffset, Day } from '$lib/utils/time';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import { onMount, onDestroy } from 'svelte';

    export let locations: Location[];
    export let labels: Record<string, Label>;
    export let happinessDataset: Dataset | null;
    export let obfuscated: boolean;
    export let container: () => HTMLElement;

    async function loadMoreDays(): Promise<void> {
        if (!nextDay) throw new Error('nextDay is null');
        const day = notify.onErr(await api.get(apiPath('/feed/?', nextDay)));
        nextDay = day.nextDayInPast;
        days = [...days, day];
    }

    onMount(() => {
        const scrollContainer = container();
        let scrollFromBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop;
        scrollContainerObserver = new MutationObserver(mutationsList => {
            if (!scrollContainer) throw new Error('scrollContainer is null on mutation');
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    scrollContainer.scrollTo(0, scrollContainer.scrollHeight - scrollFromBottom);
                }
            }
        });
        scrollContainerObserver.observe(containerEl, { childList: true });

        scrollContainer.onscroll = () => {
            if (!scrollContainer) throw new Error('scrollContainer is null on scroll');
            scrollFromBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop;
        };
    });

    onDestroy(() => scrollContainerObserver?.disconnect());

    let scrollContainerObserver: MutationObserver;
    let days = [] as FeedDay[];
    let nextDay: string | null = Day.today(currentTzOffset()).fmtIso();
    let containerEl: HTMLDivElement;
</script>

<div bind:this={containerEl} class="flex flex-col-reverse">
    <InfiniteScroller loadItems={loadMoreDays} hasMore={() => nextDay !== null}>
        {#each days as day (day.day)}
            <DayInFeed
                {day}
                {obfuscated}
                showLabels
                {locations}
                {labels}
                showForms
                {happinessDataset}
            />
        {/each}
    </InfiniteScroller>
</div>
