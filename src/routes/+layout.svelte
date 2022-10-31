<script lang="ts">
	import 'ts-polyfill';
	import '../app.less';
	import Header from '$lib/components/Header.svelte';
	import Notifications from 'svelte-notifications';
	import { INACTIVE_TIMEOUT_MS, obfuscated } from '$lib/constants';
	import { page } from '$app/stores';
	import Notifier from './Notifier.svelte';
	import Modal from 'svelte-simple-modal';
	import { popup } from '../lib/constants.js';

	export let data: Record<string, any>;

	const home = $page.url.pathname.trim() === '/';

	let lastActivity = Date.now();

	let addNotification;
	let isObfuscated = true;
	$: obfuscated.update(() => isObfuscated);

	setInterval(() => {
		if (isObfuscated) return;

		if (Date.now() - lastActivity > INACTIVE_TIMEOUT_MS) {
			addNotification({
				text: 'Hidden due to inactivity',
				type: 'info',
				removeAfter: 4000
			});
			isObfuscated = true;
		}
	}, 1000);

	function activity() {
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

<svelte:window
	on:keydown|nonpassive={keydown}
	on:mousemove|passive={activity}
	on:scroll|passive={activity}
/>
<Notifications>
	<Notifier bind:addNotification />

	{#if !home}
		<Header user={data} />
	{/if}

	<slot />
	<Modal
		show={$popup}
		classContent="popup-background"
		classWindow="popup-background"
	/>

	{#if !home}
		<footer />
	{/if}
</Notifications>
