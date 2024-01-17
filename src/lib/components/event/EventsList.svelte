<script lang="ts">
    import type { Label } from '$lib/controllers/label/label';
    import EventComponent from '$lib/components/event/Event.svelte';
    import type { Event } from '$lib/controllers/event/event';

    export let events: Event[];
    export let labels: Record<string, Label>;
    export let obfuscated: boolean;
    export let selectId: string | null = null;
</script>

<ul>
    {#each events as event}
        <div class="border-t border-borderColor only-mobile"></div>
        <li>
            <div class="container">
                <EventComponent {event} selectNameId={selectId} {labels} {obfuscated} />
            </div>
        </li>
    {/each}
</ul>

<style lang="scss">
    @import '$lib/styles/layout';

    ul {
        list-style: none;
        padding: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;

        @media #{$mobile} {
            grid-template-columns: 1fr;
            margin: 0;
        }

        @media #{$large} {
            grid-template-columns: 1fr 1fr 1fr;
        }
    }
</style>
