<script lang="ts">
    import { goto } from '$app/navigation';
    import AllowCookies from '$lib/components/AllowCookies.svelte';
    import { Auth } from '$lib/controllers/auth/auth';
    import { allowedCookies, encryptionKey, username } from '$lib/stores';
    import { onMount } from 'svelte';

    onMount(async () => {
        if ($encryptionKey || $username) {
            if (!$encryptionKey || !$username) {
                await Auth.logOut(true);
            }

            await goto('/home');
        }
    });
</script>

{#if !$allowedCookies}
    <AllowCookies />
{/if}

<slot />
