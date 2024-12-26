<script lang="ts">
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import type { ChangeEventHandler } from 'svelte/elements';
    import { goto } from '$app/navigation';
    import { encrypt } from '$lib/utils/encryption';
    import { encryptionKey } from '$lib/stores';

    export let word = '';

    const searchWordChange = (() => {
        if (!word) {
            void goto(`/stats`);
            return;
        }
        const encryptedWord = encrypt(word, $encryptionKey);
        void goto(`/stats/${encryptedWord}`);
    }) satisfies ChangeEventHandler<HTMLInputElement>;
</script>

<Textbox bind:value={word} on:change={searchWordChange} label="Search" thinBorder fullWidth />
