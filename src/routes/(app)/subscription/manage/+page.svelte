<script lang="ts">
    import SubscriptionWidget from '$lib/components/subscription/SubscriptionWidget.svelte';

    export let data;
</script>

<main class="md:p-4 md:pl-4 flex-center">
    <section class="w-full md:max-w-5xl">
        <p class="text-xl">Manage your Everywhen Subscription</p>
        <SubscriptionWidget
            activeSubscriptionType={data.activeSubscriptionType}
            prices={data.prices}
        />
    </section>
</main>
