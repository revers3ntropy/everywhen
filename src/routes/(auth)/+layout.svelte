<script lang="ts">
    import AllowCookies from '$lib/components/AllowCookies.svelte';
    import { allowedCookies } from '$lib/stores';
</script>

{#if !$allowedCookies}
    <AllowCookies />
{/if}

<slot />
