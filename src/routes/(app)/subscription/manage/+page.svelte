<script lang="ts">
    import SubscriptionWidget from '$lib/components/subscription/SubscriptionWidget.svelte';
    import UsageCharts from '../../settings/UsageCharts.svelte';

    export let data;
</script>

<main class="md:p-4 md:pl-4 flex-center">
    <section class="w-full md:max-w-5xl">
        <p class="text-2xl">Manage your Everywhen Subscription</p>
        <div class="py-8">
            <SubscriptionWidget
                activeSubscriptionType={data.activeSubscriptionType}
                prices={data.prices}
            />
        </div>
        <div>
            <UsageCharts usageData={data.usageData} />
        </div>
    </section>
</main>
