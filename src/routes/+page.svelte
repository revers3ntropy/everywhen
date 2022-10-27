<svelte:head>
    <title>Me</title>
    <meta name="description" content="Joseph Coppin's site" />
</svelte:head>
<script lang="ts">
    import { getNotificationsContext } from 'svelte-notifications';
    import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
    import { api } from "../lib/api/apiQuery";
    import type { PageData } from './$types';

    export let data: PageData;

    let password = '';

    const { addNotification } = getNotificationsContext();

    async function submit () {
        if (await api.get(data.key, '/auth?key=' + password)) {
            window.location.href = '/home';
            return;
        }

        console.error('Invalid key');
        addNotification({
            text: 'Invalid Key',
            position: 'top-center',
            type: 'error'
        });
    }
</script>
<section>
    <h1>Welcome to me.josephcoppin.com!</h1>

    <form class="flex-center page-center">
        <input bind:value={password}
               type="password"
               placeholder="Key"
               autocomplete="current-password"
               style="font-size: x-large"
        >
        <button on:click|preventDefault={submit}>
            <ChevronRight size="50"/>
        </button>
    </form>
</section>