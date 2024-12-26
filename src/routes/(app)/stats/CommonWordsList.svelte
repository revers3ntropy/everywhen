<script lang="ts">
    import { browser } from '$app/environment';
    import { notify } from '$lib/components/notifications/notifications';
    import InfiniteScroller from '$lib/components/ui/InfiniteScroller.svelte';
    import { encryptionKey } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { decrypt } from '$lib/utils/encryption';

    export let entryCount: number;
    export let uniqueWordCount: number;

    async function loadMoreWords(): Promise<void> {
        const res = notify.onErr(
            await api.get('/stats/commonWords', { offset: words.length, count: 2 })
        );
        words = [...words, ...res.words];
    }

    let words: { word: string; count: number }[] = [];
</script>

{#if uniqueWordCount > 1}
    <h2 class="text-left py-2">Common Words</h2>
    <InfiniteScroller
        loadItems={loadMoreWords}
        hasMore={() => words.length < uniqueWordCount}
        margin={500}
    >
        <div class="common-words">
            {#each words as { word, count }, i}
                <div class="text-light">#{i + 1}</div>
                <span class="ellipsis" data-sveltekit-preload-data="tap">
                    {browser ? decrypt(word, $encryptionKey).unwrap() : ''}
                </span>

                <b class="count text-right">{count}</b>

                <div class="hide-mobile text-right">
                    {(count / entryCount).toPrecision(3)} / entry
                </div>

                {#if i < words.length - 1}
                    <hr />
                {/if}
            {/each}
        </div>
    </InfiniteScroller>
{/if}

<style lang="scss">
    @import '$lib/styles/text';

    .common-words {
        margin: 0.5em 0;
        display: grid;
        grid-template-columns: 3rem 1fr 5rem 10rem;
        grid-row-gap: 0.3rem;
        align-items: center;
        max-width: 50rem;

        @media #{$mobile} {
            margin: 10px 0;
            padding: 10px 2px;
            grid-template-columns: 3rem 1fr 1fr;

            .count {
                text-align: right;
                margin-right: 2rem;
            }
        }

        hr {
            grid-column: 1 / 5;
            margin: 0.5rem 0;
            height: 0;
            border-top: 1px solid var(--border-light);
        }
    }
</style>
