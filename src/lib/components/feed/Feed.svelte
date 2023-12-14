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

    export let locations: Location[];
    export let labels: Record<string, Label>;
    export let happinessDataset: Dataset | null;
    export let obfuscated: boolean;

    async function loadMoreDays(): Promise<void> {
        if (!nextDay) throw new Error('nextDay is null');
        const day = notify.onErr(await api.get(apiPath('/feed/?', nextDay)));
        nextDay = day.nextDayInPast;
        days = [...days, day];
    }

    let days = [] as FeedDay[];
    let nextDay: string | null = Day.today(currentTzOffset()).fmtIso();
</script>

<InfiniteScroller loadItems={loadMoreDays} hasMore={() => nextDay !== null} invertDirection>
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
