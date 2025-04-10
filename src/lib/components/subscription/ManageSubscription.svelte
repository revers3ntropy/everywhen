<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import { Button } from '$lib/components/ui/button';
    import { api } from '$lib/utils/apiRequest';
    import { isProd } from '$lib/utils/env';

    async function manageSubscription() {
        if (!isProd()) {
            notify.onErr(await api.delete('/subscription/upgrade'));
            location.reload();
            return;
        }
        const response = notify.onErr(await api.get('/subscription/create-portal-session'));
        window.location.assign(response.redirectUrl);
    }
</script>

{#if !isProd()}
    <p class="pb-2 italic text-warning">Environment is not production</p>
{/if}

<Button type="submit" on:click={manageSubscription}>Cancel Subscription</Button>
