<script lang="ts">
    import { PUBLIC_GITHUB_AUTH_CLIENT_ID } from '$env/static/public';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications.js';
    import type { GitHubUser } from '$lib/controllers/ghAPI/ghAPI.server';
    import type { User } from '$lib/controllers/user/user';
    import { api } from '$lib/utils/apiRequest';
    import { serializeGETArgs } from '$lib/utils/GETArgs';
    import { onMount } from 'svelte';
    import GitHub from 'svelte-material-icons/Github.svelte';
    import { SESSION_KEYS } from '$lib/constants.js';
    import { randomInt, randomString } from '$lib/security/authUtils.client.js';

    export let size = 30;
    export let user: User;

    function authorizeUrl(state: string) {
        return (
            'https://github.com/login/oauth/authorize' +
            serializeGETArgs({
                client_id: PUBLIC_GITHUB_AUTH_CLIENT_ID,
                redirect_uri: 'https://halcyon.land/api/oauth/gh',
                state,
                scope: 'read:user repo'
            })
        );
    }

    function doOauth() {
        const state = randomString(randomInt(10, 20));
        sessionStorage.setItem(SESSION_KEYS.GH_CB, state);
        window.location.assign(authorizeUrl(state));
    }

    async function unlink() {
        await api.delete(user, '/oauth/gh');
        location.reload();
        return await new Promise(() => {});
    }

    let gitHubUser: GitHubUser | null;

    onMount(async () => {
        if (user.ghAccessToken) {
            gitHubUser = displayNotifOnErr(await api.get(user, '/oauth/gh/user'));
        }
    });
</script>

{#if user.ghAccessToken}
    <button on:click={unlink}>
        <GitHub {size} /> Unlink GitHub ({gitHubUser?.username || '...'})
    </button>
{:else}
    <button on:click={doOauth}> <GitHub {size} /> Link With GitHub </button>
{/if}
