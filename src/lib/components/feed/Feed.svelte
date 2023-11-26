<script lang="ts">
    import { obfuscated } from '$lib/stores';
    import InfiniteScroller from '$lib/components/InfiniteScroller.svelte';
    import DayInFeed from '$lib/components/feed/DayInFeed.svelte';
    import type { Location } from '$lib/controllers/location/location';
    import type { FeedDay } from '$lib/controllers/feed/feed';
    import { currentTzOffset, Day } from '$lib/utils/time';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import type { Dataset } from '$lib/controllers/dataset/dataset';

    export let locations: Location[];
    export let happinessDataset: Dataset | null;

    async function loadMoreDays(): Promise<FeedDay[]> {
        const day = notify.onErr(
            await api.get(apiPath('/feed/?', nextDay ?? Day.today(currentTzOffset()).fmtIso()))
        );
        nextDay = day.nextDayInPast;
        if (nextDay === null) {
            feedDaysCount = days.length + 1;
        }
        return [day];
    }

    let feedDaysCount = Infinity;
    let days: FeedDay[] = [];
    let nextDay: string | null = null;
</script>

<InfiniteScroller
    bind:items={days}
    batchSize={5}
    numItems={feedDaysCount}
    loadItems={loadMoreDays}
    maxMargin={200}
    minItemsHeight={50}
>
    <div class="assets">
        {#each days as day}
            <DayInFeed
                {day}
                obfuscated={$obfuscated}
                showLabels
                {locations}
                showEntryForm
                {happinessDataset}
            />
        {/each}
    </div>
    <div class="flex-center" slot="empty">
        <i>No images yet</i>
    </div>
</InfiniteScroller>
