<script lang="ts">
    import ManageSubscription from '$lib/components/subscription/ManageSubscription.svelte';
    import SubscriptionList from '$lib/components/subscription/SubscriptionList.svelte';
    import { type Pricing, SubscriptionType } from '$lib/controllers/subscription/subscription';

    export let prices: Pricing[];
    export let activeSubscriptionType: SubscriptionType;
</script>

{#if activeSubscriptionType === SubscriptionType.Free}
    <SubscriptionList {prices} />
{:else if activeSubscriptionType === SubscriptionType.Plus}
    <ManageSubscription />
{:else}
    Something went wrong
{/if}
