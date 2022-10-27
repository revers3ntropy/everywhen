<script lang="ts">
    import type { Entry as EntryType } from "$lib/types";
    import Entry from '$lib/components/Entry.svelte';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let entries: Array<EntryType>;

</script>
<div class="entry-group container">
    <div class="title">
        <slot name="title" />
    </div>
    <div class="contents">
        {#each entries as entry}
            <Entry {...entry} on:updated={dispatch('updated')}/>
        {/each}
    </div>
</div>
<style lang="less">
    @import '../../styles/variables.less';

    .entry-group {
        .title {
            margin-bottom: 0.5rem;
            padding: 0 1em;
        }
    }
</style>