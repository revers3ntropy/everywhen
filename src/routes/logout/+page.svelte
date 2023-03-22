<script lang="ts">
    import { onMount } from 'svelte';

    location.assign('/');

    onMount(() => document.title = 'Home');

</script>

<svelte:head>
    <title>Log out</title>
    <meta content="Log out" name="description" />
</svelte:head>

<main>
    <h1>
        Logging Out...
    </h1>
</main>