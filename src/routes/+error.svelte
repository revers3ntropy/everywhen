<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>{$page.status} | Halcyon.Land</title>
</svelte:head>

<main>
    <div class="container">
        <div style="font-size: 1rem; margin: 0 0 1rem 0">
            <a href="/">Home</a>
        </div>
        <div> Looks like something went wrong! </div>
        <h1 style="text-align: left; font-size: 5rem">
            {$page.status}
        </h1>
        <div style="font-size: 1.4rem">
            {$page.error?.message || 'An error occurred'}
        </div>
    </div>
</main>

<style lang="scss">
    @import '../styles/layout';

    main {
        @extend .flex-center;
        height: 100vh;

        .container {
            padding: 2rem;
        }
    }
</style>
