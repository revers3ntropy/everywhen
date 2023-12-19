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
    <EmoticonSadOutline {size} color="var(--likert-red)" />
{:else if value < 0.375}
    <EmoticonConfusedOutline {size} color="var(--likert-orange)" />
{:else if value < 0.625}
    <EmoticonNeutralOutline {size} color="var(--likert-yellow)" />
{:else if value < 0.875}
    <EmoticonHappyOutline {size} color="var(--likert-light-green)" />
{:else}
    <EmoticonExcitedOutline {size} color="var(--likert-green)" />
{/if}
