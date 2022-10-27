<script lang="ts">
    import type { Entry as EntryType } from "$lib/types";
    import Entry from '$lib/components/Entry.svelte';

    export let entries: Array<EntryType>;
    export let title: string;
</script>
<div class="entry-group">
    <div class="title">
        {title}
    </div>
    <div class="contents">
        {#each entries as entry}
            <Entry {...entry} />
        {/each}
    </div>
</div>
<style lang="less">
    @import '../../styles/variables.less';

    .entry-group {
        margin: 1rem 0;
        border: 1px solid @border;

        .title {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
    }
</style>