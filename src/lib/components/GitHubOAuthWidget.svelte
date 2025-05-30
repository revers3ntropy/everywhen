<script lang="ts">
    import { PUBLIC_GITHUB_AUTH_CLIENT_ID } from '$env/static/public';
    import { notify } from '$lib/components/notifications/notifications';
    import { Button } from '$lib/components/ui/button';
    import { Auth } from '$lib/controllers/auth/auth';
    import type { GitHubUser } from '$lib/controllers/ghAPI/ghAPI.server';
    import { settingsStore } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { isProd } from '$lib/utils/env';
    import { serializeGETArgs } from '$lib/utils/GETArgs';
    import { onMount } from 'svelte';
    import GitHub from 'svelte-material-icons/Github.svelte';
    import { SESSION_KEYS } from '$lib/constants';

    export let size = 30;

    function authorizeUrl(state: string) {
        return (
            'https://github.com/login/oauth/authorize' +
            serializeGETArgs({
                client_id: PUBLIC_GITHUB_AUTH_CLIENT_ID,
                redirect_uri: 'https://everywhen.me/api/oauth/gh',
                state,
                scope: 'read:user repo'
            })
        );
    }

    function doOauth() {
        if (!isProd()) {
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
            gitHubUser = notify.onErr(await api.get('/oauth/gh/user'));
        }
    });
</script>

{#if $settingsStore.gitHubAccessToken.value}
    <Button
        class="h-fit flex gap-4 w-full justify-start"
        variant="outline"
        aria-label="unlink with Github"
        on:click={unlink}
    >
        <div>
            <GitHub {size} />
        </div>
        <div class="text-start">
            <p> Unlink With GitHub </p>
            <p class="text-light">
                Linked to user '{gitHubUser?.username || '[loading...]'}'
            </p>
        </div>
    </Button>
{:else}
    <Button
        class="h-fit flex gap-4 w-full justify-start"
        variant="outline"
        aria-label="link to Github"
        on:click={doOauth}
    >
        <div>
            <GitHub {size} />
        </div>
        <div class="text-start">
            <p> Link With GitHub </p>
            <p class="text-light">
                Sign in with GitHub and give permission to access account to Everywhen
            </p>
        </div>
    </Button>
{/if}
