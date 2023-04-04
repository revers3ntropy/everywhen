<script lang="ts">
    export let words: [ string, number ][];
    export let entryCount: number;
</script>

<div class="common-words">
    {#each words as [word, count], i}
        <div>#{i + 1}</div>

        <a href="/stats/{word}">{word}</a>

        <div>{count}</div>

        <div>{(count / entryCount).toPrecision(3)} / entry</div>

        {#if i < words.length - 1}
            <hr />
        {/if}
    {/each}
</div>

<style lang="less">
    @import '../../styles/variables';

    .common-words {
        margin: .5em 0;
        display: grid;
        grid-template-columns: 3rem 1fr 4rem 8rem;
        grid-row-gap: .3rem;

        max-width: 700px;

        @media @mobile {
            margin: 10px 0;
            padding: 10px 2px;
        }

        hr {
            grid-column: 1 / 5;
        }
    }
</style>