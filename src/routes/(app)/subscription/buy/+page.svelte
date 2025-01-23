<script lang="ts">
    import { plusLookupKeys, SubscriptionType } from '$lib/controllers/subscription/subscription';
</script>

<main class="md:p-4 md:pl-4 flex-center">
    <section class="w-full md:max-w-5xl">
        <h2 class="py-1">Upgrade to Everywhen Plus</h2>
        <h5 class="py-1">Just £2.49 / month</h5>
        <form action="/api/subscription/create-checkout-session" method="POST" class="pt-4">
            <input type="hidden" name="lookupKey" value={plusLookupKeys[SubscriptionType.Plus]} />
            <button class="primary" type="submit"> Buy now </button>
        </form>
    </section>
</main>
