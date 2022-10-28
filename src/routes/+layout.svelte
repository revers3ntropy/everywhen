<svelte:window
	on:keydown|nonpassive={keydown}
	on:mousemove|passive={activity}
	on:scrol|passive={activity}
/>
<script lang="ts">
	import 'ts-polyfill';
	import '../app.less';
	import Header from '$lib/components/Header.svelte';
	import Notifications from 'svelte-notifications';
	import { INACTIVE_TIMEOUT_MS, obfuscated } from "$lib/constants";
	import { page } from "$app/stores";
	import Notifier from "./Notifier.svelte";

	const home = $page.url.pathname.trim() === '/';

	let lastActivity = Date.now();

	let addNotification;
	let isObfuscated = true;
	$: obfuscated.update(() => isObfuscated);

	setInterval(() => {
		if (isObfuscated) return;

		if (Date.now() - lastActivity > INACTIVE_TIMEOUT_MS) {
			addNotification?.({
				text: 'Hidden due to inactivity',
				type: 'info',
				removeAfter: 50000,
			});
			isObfuscated = true;
		}
	}, 1000);

	function activity () {
		lastActivity = Date.now();
	}

	function keydown(e: KeyboardEvent) {
		lastActivity = Date.now();
		if (e.key === 'Escape') {
			if (e.ctrlKey) {
				isObfuscated = !isObfuscated;
				e.preventDefault();
			}
		}
	}

</script>
<Notifications>

	<Notifier bind:addNotification />

	{#if !home}
		<Header />
	{/if}

	<slot />

	{#if !home}
		<footer>

		</footer>
	{/if}
</Notifications>