<script lang="ts">
    import EmoticonSadOutline from 'svelte-material-icons/EmoticonSadOutline.svelte';
    import EmoticonConfusedOutline from 'svelte-material-icons/EmoticonConfusedOutline.svelte';
    import EmoticonNeutralOutline from 'svelte-material-icons/EmoticonNeutralOutline.svelte';
    import EmoticonHappyOutline from 'svelte-material-icons/EmoticonHappyOutline.svelte';
    import EmoticonExcitedOutline from 'svelte-material-icons/EmoticonExcitedOutline.svelte';

    export let value: number;
    export let size = 24;
</script>

{#if value < 0.125}
    <EmoticonSadOutline {size} />
{:else if value < 0.375}
    <EmoticonConfusedOutline {size} />
{:else if value < 0.625}
    <EmoticonNeutralOutline {size} />
{:else if value < 0.875}
    <EmoticonHappyOutline {size} />
{:else}
    <EmoticonExcitedOutline {size} />
{/if}
