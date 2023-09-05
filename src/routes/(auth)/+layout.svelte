<script lang="ts">
    import AllowCookies from '$lib/components/AllowCookies.svelte';
    import { allowedCookies, encryptionKey, username } from '$lib/stores';
    import { onMount } from 'svelte';

    onMount(() => {
        // assume valid auth has already been filtered out in ssr
        $encryptionKey = null;
        $username = null;
    });
</script>

{#if !$allowedCookies}
    <AllowCookies />
{/if}

<slot />
