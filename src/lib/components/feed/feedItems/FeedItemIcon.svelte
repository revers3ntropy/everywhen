<script lang="ts">
    import ChartLine from 'svelte-material-icons/ChartLine.svelte';
    import CalendarEnd from 'svelte-material-icons/CalendarEnd.svelte';
    import EmoticonOutline from 'svelte-material-icons/EmoticonOutline.svelte';
    import NoteEditOutline from 'svelte-material-icons/NoteEditOutline.svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import CalendarStart from 'svelte-material-icons/CalendarStart.svelte';
    import Sleep from 'svelte-material-icons/Sleep.svelte';
    import type { FeedItem } from '$lib/controllers/feed/feed';

    export let type: FeedItem['type'] | 'event';
</script>

<div class="relative">
    <span class="flex-center absolute top-1 md:-left-4 bg-background rounded-full w-8 h-8">
        {#if type === 'entry-edit'}
            <NoteEditOutline size={24} />
        {:else if type === 'entry'}
            <span />
        {:else if type === 'happiness'}
            <EmoticonOutline size={24} />
        {:else if type === 'event-end'}
            <CalendarEnd size={24} />
        {:else if type === 'event-start'}
            <CalendarStart size={24} />
        {:else if type === 'event'}
            <Calendar size={24} />
        {:else if type === 'sleep'}
            <Sleep size={24} />
        {:else if type === 'otherDataset'}
            <ChartLine size={20} />
        {:else}
            ?
        {/if}
    </span>
</div>
