<script lang="ts">
	import { getNotificationsContext } from 'svelte-notifications';
	import { api } from '$lib/api/apiQuery';
	import { popup } from '../../lib/constants';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	const { addNotification } = getNotificationsContext();

	let labelName = '';
	let labelColour = '#000000';

	export let key: string;

	async function closeHandler() {
		if (!labelName) {
			addNotification({
				text: 'Invalid Name',
				position: 'top-center',
				type: 'error'
			});
			return;
		}

		const res = await api.post(key, '/labels', {
			name: labelName,
			colour: labelColour
		});

		if (!res.id) {
			addNotification({
				text: `Error creating label: ${res.body.message}`,
				position: 'top-center',
				type: 'error',
				removeAfter: 6000
			});
			popup.set(null);
			return;
		}

		addNotification({
			text: 'Label created',
			position: 'top-center',
			type: 'success',
			removeAfter: 3000
		});

		dispatch('submit', {
			id: res.id,
			name: labelName,
			colour: labelColour
		});

		popup.set(null);
	}
</script>

<div>
	<div>
		<h1>Create New Label</h1>
	</div>
	<div class="content">
		<input type="text" bind:value={labelName} placeholder="Name" />
		<input type="color" bind:value={labelColour} />
	</div>
	<div class="actions">
		<button on:click={closeHandler}> Create </button>
	</div>
</div>

<style lang="less">
	@import '../../styles/variables.less';

	.content {
		text-align: center;
	}

	.actions {
		display: flex;
		justify-content: center;

		button {
			border: 1px solid @border;
			border-radius: 10px;
			padding: 1em;
			margin: 1em;

			&:hover {
				background-color: @light-accent;
			}
		}
	}
</style>
