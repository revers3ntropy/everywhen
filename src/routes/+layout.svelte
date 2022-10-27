<script lang="ts">
	import 'ts-polyfill';
	import '../app.less';
	import Header from '$lib/components/Header.svelte';
	import Notifications from 'svelte-notifications';
	import { page } from "$app/stores";

	const home = $page.url.pathname.trim() === '/';
</script>
<Notifications>
	{#if !home}
		<Header />
	{/if}

	<slot />

	{#if !home}
		<footer>

		</footer>
	{/if}
</Notifications>