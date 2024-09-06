<script lang="ts">
    import LabelDot from '$lib/components/label/LabelDot.svelte';

    export let id: string;
    export let color: string;
    export let name: string;

    export let entryCount: number;
    export let eventCount: number;
</script>

<a href="/labels/{id}" class="label">
    <LabelDot {color} big />
    <span class="px-4">{name}</span>
    <span class="text-textColorLight">
        {entryCount}
        {entryCount === 1 ? 'entry' : 'entries'}{#if eventCount > 0},
            {eventCount}
            {eventCount === 1 ? 'event' : 'events'}
        {/if}
    </span>
</a>

<style lang="scss">
    @import '$lib/styles/layout';

    .label {
        display: grid;
        grid-template-columns: 1rem 2fr 1fr;
        justify-content: left;
        align-items: center;
        padding: 0.5rem 0.5rem;

        &:hover {
            background: var(--light-accent);
        }

        @media #{$mobile} {
            max-width: 100vw;
        }
    }
</style>
