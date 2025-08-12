<script lang="ts">
    import { cn } from '$lib/utils';
    import { tryDecryptText } from '$lib/utils/encryption.client';

    type $$Props = {
        text: string;
        obfuscated?: boolean;
        class?: string;
    };

    export let text: string;
    export let obfuscated = false;

    $: decryptedText = tryDecryptText(text);

    let className: $$Props['class'] = undefined;
    export { className as class };
</script>

{#if obfuscated}
    <!-- limit length of encrypted text as it is normally longer, so prevent layout shifts -->
    <span class={cn('obfuscated', className)}>{text.substring(0, decryptedText.length)}</span>
{:else}
    <span class={cn(className)}>{decryptedText}</span>
{/if}
