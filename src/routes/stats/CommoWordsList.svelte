<script lang="ts">
    export let words: [ string, number ][];
    export let entryCount: number;
</script>

<div class="common-words">
    {#each words as [word, count], i}
        <div class="common-word">
            <span style="min-width: 40px">
                #{i + 1}
            </span>
            <span style="min-width: min(20rem, 25%)">
                <b>{word}</b>
            </span>
            <span style="min-width: 25%">
                {count}
            </span>
            <span style="min-width: 25%">
                {(count / entryCount).toPrecision(3)} / entry
            </span>
        </div>
    {/each}
</div>

<style lang="less">
    @import '../../styles/variables.less';

    .common-words {
        margin: .5em 0;

        .common-word {
            border-bottom: 1px solid @border-light;
            padding: 6px 20px;

            span {
                display: inline-block;
            }

            &:last-child {
                border-bottom: none;
            }
        }

        @media @mobile {
            margin: 10px 0;
            padding: 10px 2px;

            .common-word {
                padding: 4px;
            }
        }
    }
</style>