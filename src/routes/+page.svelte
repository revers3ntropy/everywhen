<svelte:head>
    <title>Me</title>
    <meta name="description" content="Joseph Coppin's site" />
</svelte:head>

<script>
    import sha256 from 'js-sha256';
    import { getNotificationsContext } from 'svelte-notifications';
    import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
    import { PUBLIC_KEY_HASH } from '$env/static/public';

    let password = '';

    const { addNotification } = getNotificationsContext();

    function submit () {
        if (sha256.sha256(password) === PUBLIC_KEY_HASH) {
            sessionStorage.setItem('key', password);
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