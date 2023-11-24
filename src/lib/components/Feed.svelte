<script lang="ts">
    import { obfuscated } from '$lib/stores';
    import InfiniteScroller from '$lib/components/InfiniteScroller.svelte';
    import EntryGroup from '$lib/components/entry/EntryGroup.svelte';
    import type { Location } from '$lib/controllers/location/location';
    import type { FeedDay } from '$lib/controllers/feed/feed';
    import { currentTzOffset, Day } from '$lib/utils/time';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';

    export let locations: Location[];

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
    let nextDay: Day | null = null;
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
            <EntryGroup
                entries={day.entries}
                obfuscated={$obfuscated}
                showLabels
                day={new Date(day.day).getTime() / 1000}
                {locations}
                showEntryForm
            />
        {/each}
    </div>
    <div class="flex-center" slot="empty">
        <i>No images yet</i>
    </div>
</InfiniteScroller>
