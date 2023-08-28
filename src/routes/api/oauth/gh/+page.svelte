<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { PageData } from './$types';
    import { SESSION_KEYS } from '$lib/constants';
    import { api } from '$lib/utils/apiRequest';

    export let data: PageData;

    let error = false;

    onMount(async () => {
        const code = $page.url.searchParams.get('code');
        const stateFromGH = $page.url.searchParams.get('state');

        const stateTemp = sessionStorage.getItem(SESSION_KEYS.GH_CB);
        sessionStorage.removeItem(SESSION_KEYS.GH_CB);

        if (stateFromGH !== stateTemp) {
            error = true;
            return;
        }

        notify.onErr(
            await api.post('/oauth/gh', {
                code,
                state: stateFromGH
            })
        );

        await goto('/home');
    });
</script>

<main class="flex-center" style="min-height: 100vh">
    {#if error}
        <h1> Something went wrong </h1>
    {:else}
        <h2> Loading... </h2>
    {/if}
</main>
