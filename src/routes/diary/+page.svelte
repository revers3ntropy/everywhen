<script lang="ts">
	import type { Data } from "$lib/types";
	import { api } from '$lib/api/apiQuery';
	import EntryForm from "./EntryForm.svelte";
	import { getNotificationsContext } from 'svelte-notifications';
	import Entries from "./Entries.svelte";

	const { addNotification } = getNotificationsContext();
	export let data: Data;
	let clearEntryForm: () => void;
	let reloadEntries;

	async function submitEntry(event: CustomEvent) {
		const { title, entry, label, location } = event.detail;
		const res = await api.post(data, '/entries', {
			title,
			entry,
			label,
			latitude: location[0],
			longitude: location[1]
		});

		if (res.id) {
			clearEntryForm();
		} else {
			console.error(res);
			addNotification({
				text: `Cannot create entry: ${res.body.message}`,
				position: 'top-center',
				type: 'error'
			});
		}

		await reloadEntries();
	}

</script>

<svelte:head>
	<title>New Tab</title>
</svelte:head>
<main>
	<EntryForm
		on:submit={submitEntry}
		bind:reset={clearEntryForm}
		auth={data}
	/>
	<Entries
		auth={data}
		bin:reload={reloadEntries}
	/>
</main>
