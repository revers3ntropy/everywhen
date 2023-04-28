<script lang="ts">
    export let words: [string, number][];
    export let entryCount: number;
</script>

<div class="common-words">
    {#each words as [word, count], i}
        <div>#{i + 1}</div>

        <a
            href="/stats/{encodeURIComponent(word)}"
            class="word"
            data-sveltekit-preload-data="tap"
        >
            {word}
        </a>

        <b class="count">{count}</b>

        <div class="per-entry">
            {(count / entryCount).toPrecision(3)} / entry
        </div>

        {#if i < words.length - 1}
            <hr />
        {/if}
    {/each}
</div>

<style lang="less">
    @import '../../styles/variables';

    .common-words {
        margin: 0.5em 0;
        display: grid;
        grid-template-columns: 3rem 1fr 4rem 8rem;
        grid-row-gap: 0.3rem;
        max-width: 900px;

        @media @mobile {
            margin: 10px 0;
            padding: 10px 2px;
            grid-template-columns: 3rem 1fr 1fr;

            .per-entry {
                display: none;
            }

            .count {
                text-align: right;
                margin-right: 2rem;
            }
        }

        .word {
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
        }

        hr {
            grid-column: 1 / 5;
        }
    }
</style>
