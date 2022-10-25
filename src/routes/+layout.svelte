<script lang="ts">
	import Header from '$lib/header/Header.svelte';
	import Notifications from 'svelte-notifications';
	import '../app.less';
	import { page } from "$app/stores";

	const home = $page.url.pathname.trim() === '/';
</script>
<Notifications>
	{#if !home}
		<Header />
	{/if}

	<main>
		<slot />
	</main>

	{#if !home}
		<footer>

		</footer>
	{/if}
</Notifications>