<script lang="ts">
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>{$page.status} | Everywhen</title>
</svelte:head>

<main class="flex-center h-screen">
    <div>
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
