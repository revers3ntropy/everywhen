<script lang="ts">
    import SubscriptionWidget from '$lib/components/subscription/SubscriptionWidget.svelte';
    import UsageCharts from '../../settings/UsageCharts.svelte';
    import { SubscriptionType } from '$lib/controllers/subscription/subscription';

    export let data;
</script>

<main class="p-2 md:p-4 md:pl-4 flex-center">
    <section class="w-full md:max-w-5xl">
        {#if data.hasPlusWithoutSub}
            <h3>Early Bird 🥳</h3>
            <p class="pt-2 pb-8">
                As you joined before the release of Everywhen 1.0, you can enjoy Everywhen Plus for
                free :)
            </p>
        {:else}
            <p class="text-2xl">Manage your Everywhen Subscription</p>
            <div class="py-8">
                <SubscriptionWidget
                    activeSubscriptionType={data.activeSubscriptionType}
                    prices={data.prices}
                />
            </div>
        {/if}

        <div>
            <p class="text-xl">Usage</p>
            {#if data.sub !== SubscriptionType.Plus}
                <p class="text-light">Upgrade your plan to increase limits</p>
            {/if}
            <UsageCharts usageData={data.usageData} />
        </div>
    </section>
</main>
