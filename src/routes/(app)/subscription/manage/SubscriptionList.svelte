<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import { Button } from '$lib/components/ui/button';
    import type { Pricing } from '$lib/controllers/subscription/subscription';
    import { api } from '$lib/utils/apiRequest';

    export let prices: Pricing[];
    const priceFormatter = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    });

    $: price = prices[0];
    $: priceAsPounds = priceFormatter.format(price.price / 100);

    async function subscribeWithStripe() {
        const response = notify.onErr(
            await api.get('/subscription/create-checkout-session', { lookupKey: price.lookupKey })
        );
        window.location.assign(response.redirectUrl);
    }
</script>

<h2 class="py-1">Upgrade to Everywhen Plus</h2>
<h5 class="py-4">{priceAsPounds} / month</h5>

<Button type="submit" on:click={subscribeWithStripe}>Buy now</Button>
