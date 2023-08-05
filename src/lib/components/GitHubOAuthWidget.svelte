<script lang="ts">
    import { PUBLIC_GITHUB_AUTH_CLIENT_ID, PUBLIC_ENV } from '$env/static/public';
    import { displayNotifOnErr, notify } from '$lib/components/notifications/notifications.js';
    import { Auth } from '$lib/controllers/auth/auth';
    import type { GitHubUser } from '$lib/controllers/ghAPI/ghAPI.server';
    import { settingsStore } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { serializeGETArgs } from '$lib/utils/GETArgs';
    import { onMount } from 'svelte';
    import GitHub from 'svelte-material-icons/Github.svelte';
    import { SESSION_KEYS } from '$lib/constants.js';

    export let size = 30;

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
        if (PUBLIC_ENV !== 'prod') {
            notify.error('Not in prod!');
            return;
        }
        const state = Auth.randomString(Auth.randomInt(10, 20));
        sessionStorage.setItem(SESSION_KEYS.GH_CB, state);
        window.location.assign(authorizeUrl(state));
    }

    async function unlink() {
        await api.delete('/oauth/gh');
        location.reload();
        return await new Promise(() => {});
    }

    let gitHubUser: GitHubUser | null;

    onMount(async () => {
        if ($settingsStore.gitHubAccessToken.value) {
            gitHubUser = displayNotifOnErr(await api.get('/oauth/gh/user'));
        }
    });
</script>

{#if $settingsStore.gitHubAccessToken.value}
    <button on:click={unlink} class="danger">
        <GitHub {size} /> Unlink GitHub ({gitHubUser?.username || '...'})
    </button>
{:else}
    <button on:click={doOauth} class="icon-gradient-on-hover">
        <GitHub {size} /> Link With GitHub
    </button>
{/if}
