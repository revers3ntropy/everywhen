<script lang="ts">
	import { browser } from '$app/environment';
	import Geolocation from 'svelte-geolocation';
	import Send from 'svelte-material-icons/Send.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { Auth, Label } from "$lib/types";
	import { api } from '$lib/api/apiQuery';
	import { onMount } from 'svelte';
	import { getNotificationsContext } from "svelte-notifications";
	import LabelSelect from "$lib/components/LabelSelect.svelte";

	const { addNotification } = getNotificationsContext();
	const dispatch = createEventDispatcher();

	let newEntryTitle =
		(browser && localStorage.getItem('__misc_3_newEntryTitle')) || '';
	let newEntryBody =
		(browser && localStorage.getItem('__misc_3_newEntryBody')) || '';
	let newEntryLabel =
		(browser && localStorage.getItem('__misc_3_newEntryLabel')) || '';
	$: browser && localStorage.setItem('__misc_3_newEntryTitle', newEntryTitle);
	$: browser && localStorage.setItem('__misc_3_newEntryBody', newEntryBody);
	$: browser && localStorage.setItem('__misc_3_newEntryLabel', newEntryLabel);

	export let auth: Auth;
	let currentLocation = [];

	let labels: Label[] = [];

	onMount(async () => {
		const res = await api.get(auth, `/labels`);
		labels = res.labels;
	});

	export function reset() {
		newEntryTitle = '';
		newEntryBody = '';
		newEntryLabel = '';
	}

	async function submit() {
		const res = await api.post(auth, '/entries', {
			title: newEntryTitle,
			entry: newEntryBody,
			label: newEntryLabel,
			latitude: currentLocation[0],
			longitude: currentLocation[1]
		});

		if (res.id) {
			reset();
		} else {
			console.error(res);
			addNotification({
				text: `Cannot create entry: ${res.body.message}`,
				position: 'top-center',
				type: 'error'
			});
		}

		dispatch('updated');
	}

</script>

<div class="container">
	{#if browser}
		<Geolocation
			getPosition="true"
			let:error
			let:notSupported
			bind:coords={currentLocation}
		>
			{#if notSupported}
				This browser does not support the Geolocation API.
			{:else if error}
				An error occurred fetching geolocation data: {error.code}
				{error.message}
			{/if}
		</Geolocation>
	{/if}

	<div class="head">
		<input placeholder="Title" class="title" bind:value={newEntryTitle} />
		<LabelSelect {auth} bind:value={newEntryLabel} />
		<button on:click={submit} class="send">
			<Send size="30" />
		</button>
	</div>
	<textarea placeholder="Entry"
			  class="entry"
			  bind:value={newEntryBody}
	></textarea>

	<button on:click={submit} class="send-mobile">
		<Send size="30" />
	</button>
</div>

<style lang="less">
	@import '../../styles/variables.less';
	@import '../../styles/layout.less';

	.container {
		@media @mobile {
			margin: 0;
			border: none;
		}
	}

	.head {
		margin: 0;
		padding: 0.4em;
		border-bottom: 1px solid @border-light;
		display: flex;
		align-items: center;
		justify-content: space-between;

		@media @mobile {
			display: block;
		}
	}

	.title {
		border: none;
		width: 55%;
		font-size: 20px;
		margin: 0 0 0 1em;

		@media @mobile {
			width: 100%;
			margin: 0.2em;
		}
	}

	.entry {
		border-radius: 0;
		outline: none;
		border: none;
		width: calc(100% - 2.4em);
		max-width: 1500px;
		height: 500px;
		font-size: 20px;
		padding: 1.2em;

		@media @mobile {
			width: calc(100% - .8em);
			overflow-y: scroll;
			padding: .4em;
		}
	}

	.send {
		@media @mobile {
			display: none;
		}
	}

	.send-mobile {
		.flex-center();

		display: none;
		width: calc(100% - 1em);
		border: 1px solid @border;
		border-radius: 10px;
		margin: 0.5em;
		padding: 0.2em;

		@media @mobile {
			display: inline-block;
		}
	}


</style>
