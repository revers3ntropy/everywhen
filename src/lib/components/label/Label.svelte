<script lang="ts">
    import EncryptedText from '$lib/components/ui/EncryptedText.svelte';
    import type { Label } from '$lib/controllers/label/label';

    export let label: Label | null = null;

    export let obfuscated = true;
</script>

{#if label}
    <a
        class="flex-center group rounded-full bg-vLightAccent hover:bg-lightAccent py-[5px] px-2"
        href="/labels/{label.id}"
    >
        <span
            class="h-[18px] w-[18px] rounded-full border border-solid border-border"
            style="background: {label.color}"
        />
        <EncryptedText
            text={label.name}
            {obfuscated}
            class="ellipsis pl-1 text-textColorAccent group-hover:text-textColorLight"
        />
    </a>
{/if}
