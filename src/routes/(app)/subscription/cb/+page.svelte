<script lang="ts">
    import { page } from '$app/stores';
    import { GETParamIsTruthy } from '$lib/utils/GETArgs';

    $: success = $page.url.searchParams.get('success');
    $: sessionId = $page.url.searchParams.get('sessionId');
</script>

<main class="md:p-4 md:pl-4 flex-center">
    <section class="w-full md:max-w-5xl">
        {#if GETParamIsTruthy(success)}
            <div>
                <div>
                    <h3>Subscription to starter plan successful!</h3>
                </div>
            </div>
            <form action="/api/subscription/create-portal-session" method="POST">
                <input type="hidden" id="session-id" name="sessionId" value={sessionId} />
                <button id="checkout-and-portal-button" type="submit">
                    Manage your billing information
                </button>
            </form>
        {:else}
            <p>Something went wrong</p>
        {/if}
    </section>
</main>
