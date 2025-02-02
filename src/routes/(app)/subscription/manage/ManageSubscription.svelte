<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import { Button } from '$lib/components/ui/button';
    import { api } from '$lib/utils/apiRequest';

    async function manageSubscription() {
        const response = notify.onErr(await api.get('/subscription/create-portal-session'));
        window.location.assign(response.redirectUrl);
    }
</script>

<h2 class="py-4">Manage your subscription</h2>

<Button type="submit" on:click={manageSubscription}>Cancel Subscription</Button>
