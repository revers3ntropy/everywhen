<script lang="ts">
    import type { FeedItem } from '$lib/controllers/feed/feed';
    import CalendarEnd from 'svelte-material-icons/CalendarEnd.svelte';
    import EmoticonOutline from 'svelte-material-icons/EmoticonOutline.svelte';
    import NoteEditOutline from 'svelte-material-icons/NoteEditOutline.svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import CalendarStart from 'svelte-material-icons/CalendarStart.svelte';
    import Sleep from 'svelte-material-icons/Sleep.svelte';

    export let type: FeedItem['type'] | 'event';
</script>

<div class="relative">
    <span
        class="flex-center absolute top-0 md:-left-5 bg-backgroundColor rounded-full border-2 border-borderColor w-10 h-10"
    >
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
        {:else}
            ?
        {/if}
    </span>
</div>
