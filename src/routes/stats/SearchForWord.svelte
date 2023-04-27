<script lang="ts">
    import { goto } from '$app/navigation';
    import type { ChangeEventHandler } from 'svelte/elements';

    export let value = '';

    const searchWordChange = (e => {
        const word = (e.target as HTMLInputElement).value;
        void goto(`/stats/${encodeURIComponent(word)}`);
    }) satisfies ChangeEventHandler<HTMLInputElement>;
</script>

<input
    bind:value
    on:change={searchWordChange}
    placeholder="Search for Word..."
/>
