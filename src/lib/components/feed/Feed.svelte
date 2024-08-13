<script lang="ts">
    import BidirectionalInfiniteScroller from '$lib/components/ui/BidirectionalInfiniteScroller.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import DayInFeed from '$lib/components/feed/DayInFeed.svelte';
    import type { Location } from '$lib/controllers/location/location';
    import type { FeedDay } from '$lib/controllers/feed/feed';
    import { Day } from '$lib/utils/day';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import { onMount, onDestroy, tick } from 'svelte';

    export let locations: Location[];
    export let labels: Record<string, Label>;
    export let happinessDataset: Dataset | null;
    export let obfuscated: boolean;
    export let fromDay: Day;
    export let getScrollContainer: () => HTMLElement;

    function resetScroll() {
        if (!isLoadingAtTop) return;
        if (scrollContainer.scrollHeight === scrollHeight) return;

        const scrollHeightDiff = scrollContainer.scrollHeight - scrollHeight;

        console.log(
            'scrollContainer',
            scrollContainer.scrollHeight,
            scrollContainer.clientHeight,
            scrollHeightDiff
        );

        scrollContainer.scrollTop += scrollHeightDiff;
    }

    async function loadMoreDays(atTop: boolean): Promise<void> {
        isLoadingAtTop = atTop;
        const loadingDay = atTop ? nextDay : prevDay;
        if (!loadingDay) {
            throw new Error('day is null');
        }

        const day = notify.onErr(await api.get(apiPath('/feed/?', loadingDay)));
        const dayDay = Day.fromString(day.day).unwrap();
        const nextDayInFuture = day.nextDayInFuture
            ? Day.fromString(day.nextDayInFuture).unwrap()
            : null;
        if (nextDayInFuture && !nextDayInFuture.gt(dayDay)) {
            console.error(day);
            throw new Error('next day is not in future');
        }
        const nextDayInPast = day.nextDayInPast ? Day.fromString(day.nextDayInPast).unwrap() : null;
        if (nextDayInPast && !nextDayInPast.lt(dayDay)) {
            console.error(day);
            throw new Error('next day is not in past');
        }
        if (atTop) {
            if (
                (!nextDayInFuture || nextDayInFuture.isInFuture()) &&
                nextDay &&
                Day.fromString(nextDay).unwrap().isInPast()
            ) {
                // edge case: if we're loading from the top, always load today
                nextDay = Day.todayUsingNativeDate().fmtIso();
            } else if (nextDayInFuture && nextDayInFuture.isInFuture()) {
                // don't load days in the future from today
                nextDay = null;
            } else {
                nextDay = day.nextDayInFuture;
            }

            if (loadingDay !== fromDay.fmtIso()) {
                // edge case: don't load today twice, from both directions
                // not great, but idk how else to start loading from the middle
                // without lots of extra logic to get the next day...

                updateScroll();
                days = [day, ...days];
                await tick();
                resetScroll();
                updateScroll();
            }
        } else {
            prevDay = day.nextDayInPast;
            days = [...days, day];
            await tick();
            updateScroll();
        }
    }

    function moreDaysToLoad(atTop: boolean): boolean {
        return atTop ? nextDay !== null : prevDay !== null;
    }

    function updateScroll() {
        scrollHeight = scrollContainer.scrollHeight;
    }

    onMount(() => {
        scrollContainer = getScrollContainer();
        scrollContainer.onscroll = updateScroll;
    });
    onDestroy(() => {
        scrollContainerObserver?.disconnect();
    });

    let isLoadingAtTop = false;
    let scrollHeight = 0;
    let scrollContainer: HTMLElement;
    let scrollContainerObserver: MutationObserver;
    let days = [] as FeedDay[];
    let prevDay: string | null = fromDay.fmtIso();
    let nextDay: string | null = fromDay.fmtIso();
</script>

<div class="md:border-l-2 border-borderColor relative">
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
