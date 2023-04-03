<script lang="ts">
    import Entry from '../../lib/components/Entry.svelte';
    import type { Entry as EntryController } from '../../lib/controllers/entry';
    import type { Auth } from '../controllers/user';

    export let obfuscated = true;
    export let entries: EntryController[];
    export let showLabels = true;
    export let auth: Auth;
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
                {auth}
            />
        {/each}
    </div>
</div>

<style lang="less">
    @import '../../styles/variables.less';

    .entry-group {
        margin: 1em 0;
        padding: 0 0 2em 0;

        .title {
            margin-bottom: 0.5rem;
            padding: 0 1em;
        }
    }

    @media @mobile {

        .title {
            border-radius: @border-radius;
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
