<script lang="ts">
    import HorizontalRule from 'svelte-material-icons/FormatPageBreak.svelte';
    import FormatListBulleted from 'svelte-material-icons/FormatListBulleted.svelte';
    import FormatItalic from 'svelte-material-icons/FormatItalic.svelte';
    import FormatBold from 'svelte-material-icons/FormatBold.svelte';
    import FormatHeader1 from 'svelte-material-icons/FormatHeader1.svelte';
    import Dropdown from '$lib/components/ui/Dropdown.svelte';
    import Link from 'svelte-material-icons/Link.svelte';
    import CodeTags from 'svelte-material-icons/CodeTags.svelte';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
    import FormatListNumbered from 'svelte-material-icons/FormatListNumbered.svelte';
    import FormatStrikethrough from 'svelte-material-icons/FormatStrikethrough.svelte';
    import FormatQuoteClose from 'svelte-material-icons/FormatQuoteClose.svelte';
    import CodeBrackets from 'svelte-material-icons/CodeBrackets.svelte';
    import FormatText from 'svelte-material-icons/FormatText.svelte';

    export let makeWrapper: (
        before: string,
        after: string,
        insertSpaceIfEmpty?: boolean
    ) => () => void;
</script>

<Dropdown openOnHover>
    <span slot="button">
        <span class="p-1.5 rounded-full hover:bg-vLightAccent flex-center">
            <FormatText size="25" />
        </span>
    </span>

    <div class="py-3">
        <button class="with-icon icon-small" on:click={makeWrapper('**', '**', false)}>
            <FormatBold /> Bold
        </button>
        <button class="with-icon icon-small" on:click={makeWrapper('*', '*', false)}>
            <FormatItalic /> Italic
        </button>
        <button class="with-icon icon-small" on:click={makeWrapper('~~', '~~', false)}>
            <FormatStrikethrough /> Strikethrough
        </button>
        <button class="with-icon icon-small" on:click={makeWrapper('# ', '', false)}>
            <FormatHeader1 /> Header
        </button>
        <button class="with-icon icon-small" on:click={makeWrapper('`', '`')}>
            <CodeTags /> Code
        </button>
        <button class="with-icon icon-small" on:click={makeWrapper('```', '```')}>
            <CodeBrackets /> Code Block
        </button>
        <button class="with-icon icon-small" on:click={makeWrapper('\n > ', '', false)}>
            <FormatQuoteClose /> Quote
        </button>
        <button class="with-icon icon-small" on:click={makeWrapper('\n - ', '', false)}>
            <FormatListBulleted /> Bullet List
        </button>
        <button class="with-icon icon-small" on:click={makeWrapper('\n 1. ', '', false)}>
            <FormatListNumbered /> Numbered List
        </button>
        <button class="with-icon icon-small" on:click={makeWrapper('[', '](url)')}>
            <Link /> Link
        </button>
        <button class="with-icon icon-small" on:click={makeWrapper('![', '](url)')}>
            <ImageArea /> Image
        </button>
        <button class="with-icon icon-small" on:click={makeWrapper('\n---\n', '', false)}>
            <HorizontalRule /> Break
        </button>
    </div>
</Dropdown>

<style lang="scss">
    button {
        white-space: nowrap;
        color: var(--text-color);
        padding: 0.4rem 1rem;
        margin: 0;
        width: 100%;
        text-align: left;

        &:hover,
        &:focus {
            background: var(--v-light-accent);
        }
    }
</style>
