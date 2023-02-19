<script lang="ts">
    import type { Entry as EntryType } from "$lib/types";
    import Entry from "$lib/components/Entry.svelte";

    export let obfuscated = true;
    export let entries: Array<EntryType>;
    export let showLabels = true;
</script>

<div class="entry-group container">
    <div class="title">
        <slot name="title" />
    </div>
    <div class="contents">
        {#each entries as entry}
            <Entry
                {...entry}
                on:updated
                {obfuscated}
                {showLabels}
            />
        {/each}
    </div>
</div>

<style lang="less">
    @import '../../styles/variables.less';

    .entry-group {
        margin: 1em 0;

        .title {
            margin-bottom: 0.5rem;
            padding: 0 1em;
        }
    }

    @media @mobile {

        .title {
            border-radius: 10px;
            background: @light-accent;
            margin: 0.3em;
            position: sticky;
            top: 0.3em;
        }

        .entry-group {
            margin: 0;
            border: none;
            border-radius: 0
        }
    }
</style>
