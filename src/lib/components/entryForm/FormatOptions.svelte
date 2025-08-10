<script lang="ts">
    import HorizontalRule from 'svelte-material-icons/FormatPageBreak.svelte';
    import FormatListBulleted from 'svelte-material-icons/FormatListBulleted.svelte';
    import FormatItalic from 'svelte-material-icons/FormatItalic.svelte';
    import FormatBold from 'svelte-material-icons/FormatBold.svelte';
    import FormatHeader1 from 'svelte-material-icons/FormatHeader1.svelte';
    import Link from 'svelte-material-icons/Link.svelte';
    import CodeTags from 'svelte-material-icons/CodeTags.svelte';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
    import FormatListNumbered from 'svelte-material-icons/FormatListNumbered.svelte';
    import FormatStrikethrough from 'svelte-material-icons/FormatStrikethrough.svelte';
    import FormatQuoteClose from 'svelte-material-icons/FormatQuoteClose.svelte';
    import CodeBrackets from 'svelte-material-icons/CodeBrackets.svelte';
    import FormatText from 'svelte-material-icons/FormatText.svelte';
    import * as Popover from '$lib/components/ui/popover';
    import { cn } from '$lib/utils';
    import { buttonVariants } from '$lib/components/ui/button';

    export let makeWrapper: (
        before: string,
        after: string,
        insertSpaceIfEmpty?: boolean
    ) => () => void;

    function onClickFactory(before: string, after: string, insertSpaceIfEmpty = true): () => void {
        return () => {
            makeWrapper(before, after, insertSpaceIfEmpty)();
            popoverOpen = false;
        };
    }

    let popoverOpen = false;

    const iconSize = 20;
    const buttonClass = 'flex items-center gap-3 hover:bg-vLightAccent p-2';
</script>

<Popover.Root bind:open={popoverOpen}>
    <Popover.Trigger
        class={cn(
            buttonVariants({ variant: 'outline' }),
            'bg-transparent px-2 text-md gap-1 hover:bg-vLightAccent rounded-full hover:text-textColor aspect-square'
        )}
    >
        <FormatText size="25" />
    </Popover.Trigger>
    <Popover.Content class="py-3 px-0 flex flex-col">
        <button class={buttonClass} on:click={onClickFactory('**', '**', false)}>
            <FormatBold size={iconSize} /> Bold
        </button>
        <button class={buttonClass} on:click={onClickFactory('*', '*', false)}>
            <FormatItalic size={iconSize} /> Italic
        </button>
        <button class={buttonClass} on:click={onClickFactory('~~', '~~', false)}>
            <FormatStrikethrough size={iconSize} /> Strikethrough
        </button>
        <button class={buttonClass} on:click={onClickFactory('# ', '', false)}>
            <FormatHeader1 size={iconSize} /> Header
        </button>
        <button class={buttonClass} on:click={onClickFactory('`', '`')}>
            <CodeTags size={iconSize} /> Code
        </button>
        <button class={buttonClass} on:click={onClickFactory('```', '```')}>
            <CodeBrackets size={iconSize} /> Code Block
        </button>
        <button class={buttonClass} on:click={onClickFactory('\n > ', '', false)}>
            <FormatQuoteClose size={iconSize} /> Quote
        </button>
        <button class={buttonClass} on:click={onClickFactory('\n - ', '', false)}>
            <FormatListBulleted size={iconSize} /> Bullet List
        </button>
        <button class={buttonClass} on:click={onClickFactory('\n 1. ', '', false)}>
            <FormatListNumbered size={iconSize} /> Numbered List
        </button>
        <button class={buttonClass} on:click={onClickFactory('[', '](url)')}>
            <Link size={iconSize} /> Link
        </button>
        <button class={buttonClass} on:click={onClickFactory('![', '](url)')}>
            <ImageArea size={iconSize} /> Image
        </button>
        <button class={buttonClass} on:click={onClickFactory('\n---\n', '', false)}>
            <HorizontalRule size={iconSize} /> Break
        </button>
    </Popover.Content>
</Popover.Root>
