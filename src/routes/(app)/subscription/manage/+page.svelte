<script lang="ts">
    import { api } from '$lib/utils/apiRequest';
    import Reload from 'svelte-material-icons/Reload.svelte';
    import { Button } from '$lib/components/ui/button';
    import { SubscriptionType } from '$lib/controllers/subscription/subscription';
    import ManageSubscription from './ManageSubscription.svelte';
    import SubscriptionList from './SubscriptionList.svelte';

    export let data;

    async function reloadSubscription() {
        await api.post('/subscription/validate');
        window.location.reload();
    }
</script>

<main class="md:p-4 md:pl-4 flex-center">
    <section class="w-full md:max-w-5xl">
        {#if data.activeSubscriptionType === SubscriptionType.Free}
            <SubscriptionList prices={data.prices} />
        {:else if data.activeSubscriptionType === SubscriptionType.Plus}
            <ManageSubscription />
        {:else}
            Something went wrong
        {/if}
        <p class="pt-8">
            <Button on:click={reloadSubscription} variant="outline">
                <Reload class="pr-2" size={30} /> Refresh Subscription
            </Button>
        </p>
    </section>
</main>
