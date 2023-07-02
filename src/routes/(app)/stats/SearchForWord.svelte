<script lang="ts">
    import type { Auth } from '$lib/controllers/user/user';
    import type { ChangeEventHandler } from 'svelte/elements';
    import { goto } from '$app/navigation';
    import { encrypt } from '$lib/security/encryption.client';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications.js';

    export let auth: Auth;
    export let value = '';

    const searchWordChange = (e => {
        const word = (e.target as HTMLInputElement).value;
        const encryptedWord = displayNotifOnErr(encrypt(word, auth.key));
        void goto(`/stats/${encryptedWord}`);
    }) satisfies ChangeEventHandler<HTMLInputElement>;
</script>

<input bind:value on:change={searchWordChange} placeholder="Search for Word..." />
