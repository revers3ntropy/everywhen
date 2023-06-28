<script lang="ts">
    import { goto } from '$app/navigation';
    import type { Auth } from '$lib/controllers/user';
    import { encrypt } from '$lib/security/encryption';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications.js';
    import type { ChangeEventHandler } from 'svelte/elements';

    export let auth: Auth;
    export let value = '';

    const searchWordChange = (e => {
        const word = (e.target as HTMLInputElement).value;
        const encryptedWord = displayNotifOnErr(encrypt(word, auth.key));
        void goto(`/stats/${encryptedWord}`);
    }) satisfies ChangeEventHandler<HTMLInputElement>;
</script>

<input
    bind:value
    on:change={searchWordChange}
    placeholder="Search for Word..."
/>
