<script lang="ts">
    import { PUBLIC_GITHUB_AUTH_CLIENT_ID } from '$env/static/public';
    import { serializeGETArgs } from '$lib/utils/GETArgs';
    import GitHub from 'svelte-material-icons/Github.svelte';
    import { SESSION_KEYS } from '$lib/constants.js';
    import { randomInt, randomString } from '$lib/security/authUtils.client.js';

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
        const state = randomString(randomInt(10, 20));
        sessionStorage.setItem(SESSION_KEYS.GH_CB, state);
        window.location.assign(authorizeUrl(state));
    }
</script>

<button on:click={doOauth}> <GitHub {size} /> Sign In With GitHub </button>
