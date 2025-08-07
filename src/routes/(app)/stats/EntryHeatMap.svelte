<script lang="ts">
    import * as Select from '$lib/components/ui/select';
    import { By, Grouping, type StatsData } from '$lib/controllers/stats/stats';
    import { Day } from '$lib/utils/day';
    import Heatmap from '$lib/components/ui/heatmap/Heatmap.svelte';
    import { onMount } from 'svelte';
    import ToggleSwitch from 'svelte-material-icons/ToggleSwitch.svelte';
    import ToggleSwitchOff from 'svelte-material-icons/ToggleSwitchOff.svelte';
    import { Skeleton } from '$lib/components/ui/skeleton';

    export let earliestEntryDay: Day;
    export let getBucketisedData: (
        bucket: Grouping,
        from: Day | null,
        to: Day | null
    ) => Promise<StatsData>;

    function toggleBy() {
        by = by === By.Entries ? By.Words : By.Entries;
    }

    async function changeYear(year: string) {
        showingYear = year;
        if (year === 'Last Year') {
            startDate = Day.todayUsingNativeDate().plusMonths(-12);
            endDate = Day.todayUsingNativeDate();
        } else {
            startDate = new Day(parseInt(showingYear), 1, 1);
            endDate = new Day(parseInt(showingYear), 12, 31).min(Day.todayUsingNativeDate());
        }

        const entriesByDay = await getBucketisedData(Grouping.Day, startDate, endDate);

        const byEntries = [];
        const byWords = [];
        for (let i = 0; i < entriesByDay.labels.length; i++) {
            byEntries.push({
                date: entriesByDay.labels[i],
                value: entriesByDay.values[By.Entries][i]
            });
            byWords.push({
                date: entriesByDay.labels[i],
                value: entriesByDay.values[By.Words][i]
            });
        }
        data = { [By.Entries]: byEntries, [By.Words]: byWords };
    }

    let by = By.Entries;
    let showingYear: string;
    let startDate: Day;
    let endDate: Day;

    let data: Record<By, { date: string; value: number }[]> | null = null;

    onMount(async () => {
        await changeYear('Last Year');
    });

    $: currentData = data?.[by];
</script>

{#if currentData?.length}
    <div class="py-2">
        <div class="overflow-x-auto py-2" style="direction: rtl">
            <div style="width: {Math.round(startDate.daysUntil(endDate) * 3.2)}px; direction: ltr">
                <Heatmap
                    data={currentData.map(({ date, value }) => ({ date: new Date(date), value }))}
                    view={'weekly'}
                    allowOverflow={false}
                    cellGap={1}
                    cellRadius={1}
                    colors={['#95eab0', '#52d8bd', '#3397bd', '#0051cf']}
                    emptyColor={'var(--light-accent)'}
                    fontColor={'var(--text-color-light)'}
                    fontSize={7}
                    monthGap={22}
                    dayLabelWidth={20}
                    dayLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
                    startDate={startDate.dateObj()}
                    endDate={endDate.dateObj()}
                />
            </div>
        </div>
    </div>

    <div class="flex gap-4">
        <div>
            <button
                class="flex-center gap-2 bg-vLightAccent rounded-xl px-3 py-1"
                on:click={toggleBy}
            >
                <span class:text-light={by !== By.Words}> By Words </span>
                {#if by === By.Entries}
                    <ToggleSwitch size="30" />
                {:else}
                    <ToggleSwitchOff size="30" />
                {/if}
                <span class:text-light={by !== By.Entries}> By Entries </span>
            </button>
        </div>
        {#if Day.todayUsingNativeDate().year - earliestEntryDay.year > 0}
            <div class="flex-center bg-vLightAccent rounded-xl">
                <Select.Root
                    name="showing year"
                    selected={{ value: showingYear }}
                    onSelectedChange={selected => {
                        if (selected && 'value' in selected) changeYear(selected.value);
                    }}
                >
                    <Select.Trigger class="w-[180px]">{showingYear}</Select.Trigger>
                    <Select.Content>
                        <Select.Group>
                            <Select.Item
                                value={'Last Year'}
                                label="Last Year"
                                disabled={showingYear === 'Last Year'}
                                class="data-[highlighted]:bg-backgroundColor"
                            >
                                Last Year ({Day.todayUsingNativeDate().year -
                                    1}-{Day.todayUsingNativeDate().year}
                            </Select.Item>
                            {#each { length: Day.todayUsingNativeDate().year - earliestEntryDay.year } as _, i (i)}
                                {@const yearStr = (Day.todayUsingNativeDate().year - i).toString()}
                                <Select.Item
                                    value={yearStr}
                                    label={yearStr}
                                    disabled={showingYear === yearStr}
                                    class="data-[highlighted]:bg-backgroundColor"
                                >
                                    {yearStr}
                                </Select.Item>
                            {/each}
                        </Select.Group>
                    </Select.Content>
                </Select.Root>
            </div>
        {/if}
    </div>
{:else}
    <div class="flex flex-col gap-4">
        <Skeleton class="w-full h-[160px]" />
        <Skeleton class="w-full h-[60px]" />
    </div>
{/if}
