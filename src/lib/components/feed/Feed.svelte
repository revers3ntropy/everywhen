<script lang="ts">
    import BidirectionalInfiniteScroller from '$lib/components/ui/BidirectionalInfiniteScroller.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import DayInFeed from '$lib/components/feed/DayInFeed.svelte';
    import type { Location } from '$lib/controllers/location/location';
    import type { FeedDay } from '$lib/controllers/feed/feed';
    import { Day } from '$lib/utils/day';
    import { currentTzOffset } from '$lib/utils/time';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import { onMount, onDestroy } from 'svelte';

    export let locations: Location[];
    export let labels: Record<string, Label>;
    export let happinessDataset: Dataset | null;
    export let obfuscated: boolean;
    export let fromDay: Day;
    export let getScrollContainer: () => HTMLElement;

    async function loadMoreDays(atTop: boolean): Promise<void> {
        isLoadingAtTop = atTop;
        const loadingDay = atTop ? nextDay : prevDay;
        if (!loadingDay) throw new Error('day is null');
        const day = notify.onErr(await api.get(apiPath('/feed/?', loadingDay)));
        if (atTop) {
            if (
                (!day.nextDayInFuture ||
                    Day.fromString(day.nextDayInFuture).unwrap().isInFuture()) &&
                nextDay &&
                Day.fromString(nextDay).unwrap().isInPast()
            ) {
                // edge case: if we're loading from the top, always load today
                nextDay = Day.today(currentTzOffset()).fmtIso();
            } else if (
                day.nextDayInFuture &&
                Day.fromString(day.nextDayInFuture).unwrap().isInFuture()
            ) {
                // don't load days in the future from today
                nextDay = null;
            } else {
                nextDay = day.nextDayInFuture;
            }

            if (loadingDay !== fromDay.fmtIso()) {
                // edge case: don't load today twice, from both directions
                // not great, but idk how else to start loading from the middle
                // without lots of extra logic to get the next day...
                days = [day, ...days];
            }
        } else {
            prevDay = day.nextDayInPast;
            days = [...days, day];
        }
    }

    function moreDaysToLoad(atTop: boolean): boolean {
        return atTop ? nextDay !== null : prevDay !== null;
    }

    function setUpScrollListeners() {
        const scrollContainer = getScrollContainer();
        let scrollFromBottom = 0;
        let scrollFromTop = 0;
        const updateScroll = () => {
            scrollFromBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop;
            scrollFromTop = scrollContainer.scrollTop;
        };
        updateScroll();
        scrollContainerObserver = new MutationObserver((mutationsList: MutationRecord[]) => {
            const scrollTo = isLoadingAtTop
                ? scrollContainer.scrollHeight - scrollFromBottom
                : scrollFromTop;
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    scrollContainer.scrollTo(0, scrollTo);
                }
            }
            updateScroll();
        });
        scrollContainerObserver.observe(containerEl, { childList: true });
        scrollContainer.onscroll = updateScroll;
    }

    onMount(() => {
        setUpScrollListeners();
    });
    onDestroy(() => {
        scrollContainerObserver?.disconnect();
    });

    let isLoadingAtTop = false;
    let scrollContainerObserver: MutationObserver;
    let containerEl: HTMLDivElement;
    let days = [] as FeedDay[];
    let prevDay: string | null = fromDay.fmtIso();
    let nextDay: string | null = fromDay.fmtIso();
</script>

<div bind:this={containerEl} class="md:border-l-2 border-borderColor relative">
    <BidirectionalInfiniteScroller
        loadItems={loadMoreDays}
        hasMore={moreDaysToLoad}
        topMargin={500}
    >
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
    </BidirectionalInfiniteScroller>
</div>
