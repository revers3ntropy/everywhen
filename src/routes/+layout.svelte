<svelte:window
	on:keydown={checkKey}
/>
<script lang="ts">
	import 'ts-polyfill';
	import '../app.less';
	import Header from '$lib/components/Header.svelte';
	import Notifications from 'svelte-notifications';
	import { isObfuscated } from "$lib/constants";
	import { page } from "$app/stores";

	const home = $page.url.pathname.trim() === '/';

	function checkKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (e.ctrlKey) {
				isObfuscated.update((v) => !v);
			}
		}
	}
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