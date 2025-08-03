<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import { Button } from '$lib/components/ui/button';
    import type { Pricing } from '$lib/controllers/subscription/subscription';
    import { api } from '$lib/utils/apiRequest';

    export let prices: Pricing[];

    $: price = prices[0];

    async function subscribeWithStripe() {
        const response = notify.onErr(
            await api.get('/subscription/create-checkout-session', { lookupKey: price.lookupKey })
        );
        window.location.assign(response.redirectUrl);
    }
</script>

{#if price}
    <p class="text-lg">Upgrade to Everywhen Plus</p>
    <p class="py-2 text-light">{(price.price / 100).toFixed(2)} GBP / month</p>

    <Button type="submit" on:click={subscribeWithStripe}>Upgrade now</Button>
{:else}
    <p>Payments with Stripe don't seem to be working!</p>
{/if}
