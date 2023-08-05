<script lang="ts">
    import type { ChangeEventHandler } from 'svelte/elements';
    import { goto } from '$app/navigation';
    import { encrypt } from '$lib/utils/encryption/encryption.client';
    import { encryptionKey } from '$lib/stores';

    export let value = '';

    const searchWordChange = (e => {
        const word = (e.target as HTMLInputElement).value;
        const encryptedWord = encrypt(word, $encryptionKey);
        void goto(`/stats/${encryptedWord}`);
    }) satisfies ChangeEventHandler<HTMLInputElement>;
</script>

<input bind:value on:change={searchWordChange} placeholder="Search for Word..." />
