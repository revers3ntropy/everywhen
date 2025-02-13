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

    let className: $$Props['class'] = undefined;
    export { className as class };
</script>

{#if obfuscated}
    <span class={cn('obfuscated', className)}>{text}</span>
{:else}
    <span class={cn(className)}>{tryDecryptText(text)}</span>
{/if}
