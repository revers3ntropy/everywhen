<script lang="ts">
    import InfiniteScroller from '$lib/components/InfiniteScroller.svelte';
    import { notify } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import Close from 'svelte-material-icons/Close.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Menu from 'svelte-material-icons/Menu.svelte';
    import { Entry, type EntryTitle } from '$lib/controllers/entry/entry';
    import EntryTitles from './EntryTitles.svelte';

    export let obfuscated = false;

    async function loadMoreTitles(offset: number, count: number): Promise<string[]> {
        const { titles: newTitles, totalEntryCount } = notify.onErr(
            await api.get('/entries/titles', { offset, count })
        );
        numTitles = totalEntryCount;

        titles = Entry.groupEntriesByDay(newTitles, titles);

        return newTitles.map(t => t.id);
    }

    let showing = false;
    let titles = {} as Record<string, EntryTitle[]>;
    let numTitles = -1;
    let titleIds: string[] = [];
</script>

<div class="floating-button only-mobile">
    <button aria-label="Show sidebar menu" on:click={() => (showing = !showing)}>
        <Menu size="40" />
    </button>
</div>
<div class="sidebar {showing ? 'showing' : ''}">
    <div class="header">
        <button
            aria-label={obfuscated ? 'Show entries' : 'Hide entries'}
            on:click={() => (obfuscated = !obfuscated)}
        >
            {#if obfuscated}
                <Eye size="25" />
            {:else}
                <EyeOff size="25" />
            {/if}
        </button>
        <button
            class="only-mobile"
            aria-label="Close sidebar menu"
            on:click={() => (showing = !showing)}
        >
            <Close size="30" />
        </button>
    </div>
    <div>
        <InfiniteScroller
            bind:items={titleIds}
            batchSize={100}
            numItems={numTitles}
            loadItems={loadMoreTitles}
            margin="500px"
        >
            <EntryTitles {obfuscated} {titles} hideBlurToggle />
        </InfiniteScroller>
    </div>
</div>

<style lang="less">
    @import '../../../styles/variables';

    .sidebar {
        width: 100%;
        overflow-y: auto;
        padding: 0 0 0 0.5rem;

        @media @not-mobile {
            position: sticky;
            top: 1rem;
            height: calc(100vh - 2rem);
            // for the scroll bar
            border-radius: 0;
            background: none;
        }

        @media @mobile {
            background: var(--v-light-accent);
            height: 100vh;
            z-index: 10;
            transition: @transition;
            transform: translateX(-100%);
            position: fixed;
            top: 0;
            left: 0;
            margin: 0;

            &.showing {
                transform: translateX(0);
                border-right: 2px solid var(--border-heavy);
            }
        }

        .header {
            padding: 0.5rem;
            display: flex;
            justify-content: right;
            align-content: center;
            position: sticky;
            top: 0;
        }
    }
</style>
