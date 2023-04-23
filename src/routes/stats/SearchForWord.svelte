<script lang="ts">
    import type { ChangeEventHandler } from 'svelte/elements';

    export let value = '';

    const searchWordChange = (e => {
        const word = (e.target as HTMLInputElement).value;
        location.assign(`/stats/${encodeURIComponent(word)}`);
    }) satisfies ChangeEventHandler<HTMLInputElement>;

</script>

<input
    bind:value
    on:change={searchWordChange}
    placeholder="Search for Word..."
>