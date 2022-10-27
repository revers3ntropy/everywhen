<script lang="ts">
    import type { Entry as EntryType } from "$lib/types";
    import Entry from '$lib/components/Entry.svelte';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let entries: Array<EntryType>;

</script>
<div class="entry-group">
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
        margin: 1em;
        padding: 1em 0;
        border: 1px solid @border;
        border-radius: 10px;

        .title {
            margin-bottom: 0.5rem;
            padding: 0 1.5em;
        }
    }
</style>