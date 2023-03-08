<script lang="ts">
    import type { App } from '../../app';
    import { Entry } from '../../lib/controllers/entry';

    export let data: App.PageData & {
        entries: Entry[],
        entryCount: number,
        wordCount: number,
        charCount: number,
    };
</script>

<main>
    <h1>{data.entryCount} Entries</h1>

    <section class="stats">
        <div>
            <span>{data.wordCount}</span>
            Words
        </div>
        <div>
            <span>{data.charCount}</span>
            Characters
        </div>
        <div>
            <span>{Math.round(data.wordCount / data.entryCount)}</span>
            Words/Entry
        </div>
        <div>
            <span>{Math.round(data.charCount / data.wordCount)}</span>
            Characters/Word
        </div>
    </section>
</main>

<style lang="less">
    @import '../../styles/variables.less';

    .stats {
        text-align: center;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;

        div {
            background: @light-accent;
            padding: 0.3rem;
            border-radius: 0.5rem;
            margin: 0.5rem;
            font-size: 0.90rem;

            span {
                font-weight: bold;
                font-size: 1rem;
            }
        }
    }
</style>