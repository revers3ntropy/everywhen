<script lang="ts">
    import { Calendar } from '$lib/components/ui/calendar';
    import { cn } from '$lib/utils';
    import { Day } from '$lib/utils/day';
    import * as Popover from '$lib/components/ui/popover';
    import { Button } from '$lib/components/ui/button';
    import CalendarRange from 'svelte-material-icons/CalendarRange.svelte';

    export let earliestDate: Day;
    export let dateRange: [Day, Day];
    let from = dateRange[0];
    let to = dateRange[1];
    $: dateRange = [from, to];

    let fromI18nDate = from.toI18nDate();
    $: from = Day.fromI18nDate(fromI18nDate);
    let toI18nDate = to.toI18nDate();
    $: to = Day.fromI18nDate(toI18nDate);
</script>

<div class="bg-lightAccent rounded-lg border-borderColor border p-1 flex items-center gap-1">
    <Popover.Root>
        <Popover.Trigger asChild let:builder>
            <Button class={cn('justify-start')} builders={[builder]}>
                {from.fmtIso('/')}
            </Button>
        </Popover.Trigger>
        <Popover.Content class="w-auto p-0">
            <Calendar bind:value={fromI18nDate} initialFocus />
        </Popover.Content>
    </Popover.Root>
    -
    <Popover.Root>
        <Popover.Trigger asChild let:builder>
            <Button class={cn('justify-start')} builders={[builder]}>
                {to.fmtIso('/')}
            </Button>
        </Popover.Trigger>
        <Popover.Content class="w-auto p-0">
            <Calendar bind:value={toI18nDate} initialFocus />
        </Popover.Content>
    </Popover.Root>

    <Popover.Root>
        <Popover.Trigger asChild let:builder>
            <Button
                class={cn('justify-start', !to && 'text-muted-foreground')}
                builders={[builder]}
            >
                <CalendarRange size={22} />
            </Button>
        </Popover.Trigger>
        <Popover.Content
            class="w-auto flex flex-col justify-start px-0 py-2 max-h-[90vh] overflow-y-auto"
        >
            <button
                on:click={() => {
                    fromI18nDate = Day.todayUsingNativeDate().toI18nDate();
                    toI18nDate = Day.todayUsingNativeDate().toI18nDate();
                }}
                class="text-left hover:bg-vLightAccent px-4 py-2"
            >
                Today
            </button>
            <button
                on:click={() => {
                    fromI18nDate = Day.todayUsingNativeDate().plusDays(-7).toI18nDate();
                    toI18nDate = Day.todayUsingNativeDate().toI18nDate();
                }}
                class="text-left hover:bg-vLightAccent px-4 py-2"
            >
                Last Week
            </button>
            <button
                on:click={() => {
                    fromI18nDate = Day.todayUsingNativeDate().plusMonths(-1).toI18nDate();
                    toI18nDate = Day.todayUsingNativeDate().toI18nDate();
                }}
                class="text-left hover:bg-vLightAccent px-4 py-2"
            >
                Last Month
            </button>
            <button
                on:click={() => {
                    fromI18nDate = Day.todayUsingNativeDate().plusMonths(-12).toI18nDate();
                    toI18nDate = Day.todayUsingNativeDate().toI18nDate();
                }}
                class="text-left hover:bg-vLightAccent px-4 py-2"
            >
                Last Year
            </button>
            <!-- years from last year to yeah of earliest date -->
            {#each Array.from({ length: Day.todayUsingNativeDate().year - earliestDate.year + 1 }, (_, i) => Day.todayUsingNativeDate().year - i) as year}
                <button
                    on:click={() => {
                        fromI18nDate = new Day(year, 0, 1).toI18nDate();
                        toI18nDate = new Day(year, 12, 31).toI18nDate();
                    }}
                    class="text-left hover:bg-vLightAccent px-4 py-2"
                >
                    {year}
                </button>
            {/each}
        </Popover.Content>
    </Popover.Root>
</div>
