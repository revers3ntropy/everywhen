<script lang="ts">
    import type { Pricing } from '$lib/controllers/subscription/subscription';

    export let prices: Pricing[];
    const priceFormatter = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    });

    $: price = prices[0];
    $: priceAsPounds = priceFormatter.format(price.price / 100);
</script>

<h2 class="py-1">Upgrade to Everywhen Plus</h2>
<h5 class="py-1">Just {priceAsPounds} / month</h5>
<form action="/api/subscription/create-checkout-session" method="POST" class="pt-4">
    <input type="hidden" name="lookupKey" value={price.lookupKey} />
    <button class="primary" type="submit"> Buy now </button>
</form>
