<script lang="ts">
	import { browser } from '$app/environment';
	import Geolocation from 'svelte-geolocation';
	import Send from 'svelte-material-icons/Send.svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { Auth, Label } from "$lib/types";
	import NewLabelDialog from './NewLabelDialog.svelte';
	import { api } from '$lib/api/apiQuery';
	import { onMount } from 'svelte';
	import { showPopup } from "$lib/utils";
	import Dropdown from "$lib/components/Dropdown.svelte";

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

	function submit() {
		dispatch('submit', {
			title: newEntryTitle,
			entry: newEntryBody,
			label: newEntryLabel,
			location: currentLocation
		});
	}

	function showNewLabelPopup() {
		showPopup(NewLabelDialog, { auth }, async () => {
			const res = await api.get(auth, `/labels`);
			labels = res.labels;
			newEntryLabel = labels.sort((a, b) => b.created - a.created)[0].id;
		});
	}

	let closeLabelDropDown;
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

		<div class="select-label">
			<Dropdown bind:value={newEntryLabel} bind:close={closeLabelDropDown}>
				<span slot="button" class="select-button">
					<span class="entry-label-colour"
						  style="background: {labels
						  	.find(l => l.id === newEntryLabel)?.colour || 'transparent'
						  }"
					></span>
					{labels.find(l => l.id === newEntryLabel)?.name || 'No Label'}
				</span>
				<button on:click={() => { closeLabelDropDown(); newEntryLabel = '' }}
						class="label-button single"
				>
					No Label
				</button>
				{#each labels as label (label.id)}
					<button on:click={() => { closeLabelDropDown(); newEntryLabel = label.id }}
							class="label-button"
					>
						<span class="entry-label-colour"
							  style="background: {label.colour}"
						></span>
						{#if newEntryLabel === label.id}
							<b>✓ {label.name}</b>
						{:else}
							{label.name}
						{/if}
					</button>
				{/each}
			</Dropdown>

			<button on:click={showNewLabelPopup} class="icon-button">
				<Plus size="25" />
			</button>
		</div>

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

	.select-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		background-color: @light-accent;
		border-radius: 10px;
		border: none;

		select {
			background-color: transparent;
			border: none;
		}

		.icon-button {
			background: transparent;
			padding: 0.2em;
			border-radius: 10px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			border: 1px solid @light-accent;

			&:hover {
				background: @bg;
			}
		}

		.select-button {
			display: inline-grid;
			grid-template-columns: 20px 3fr;
			align-items: center;
			margin: 0 1em;
			justify-items: left;
		}
	}

	.label-button {
		height: 2em;
		width: 100%;
		padding: 0 1em;
		margin: 0;
		text-align: center;
		display: inline-grid;
		grid-template-columns: 1fr 3fr;
		justify-content: center;
		align-items: center;

		&:hover {
			background: @bg;
			border-radius: 10px;
			border: 1px solid @border;
		}

		&.single {
			grid-template-columns: 1fr;
		}
	}
</style>
