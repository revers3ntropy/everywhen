<script lang="ts">
    import AllowCookies from '$lib/components/AllowCookies.svelte';
    import { Auth } from '$lib/controllers/auth/auth';
    import { allowedCookies, encryptionKey, username } from '$lib/stores';
    import { onMount } from 'svelte';

    onMount(async () => {
        // assume valid auth has already been filtered out in ssr
        if ($encryptionKey || $username) {
            await Auth.logOut(true);
        }
    });
</script>

{#if !$allowedCookies}
    <AllowCookies />
{/if}

<slot />
