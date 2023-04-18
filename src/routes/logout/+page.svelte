<script lang="ts">
    import { onMount } from 'svelte';
    import { LS_KEY } from '../../lib/constants';

    onMount(() => {
        document.title = 'Log out';

        for (let key in LS_KEY) {
            localStorage.removeItem(LS_KEY[key as keyof typeof LS_KEY]);
        }

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