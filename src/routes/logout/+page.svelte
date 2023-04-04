<script lang="ts">
    import { onMount } from 'svelte';
    import { LS_KEY } from '../../lib/constants';

    onMount(() => {
        document.title = 'Log out';
        localStorage.removeItem(LS_KEY.newEntryTitle);
        localStorage.removeItem(LS_KEY.newEntryBody);
        localStorage.removeItem(LS_KEY.newEntryLabel);
        location.assign('/');
    });

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