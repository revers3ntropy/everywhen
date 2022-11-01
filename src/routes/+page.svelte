<script lang="ts">
	import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
	import { api } from '$lib/api/apiQuery';
	import { getNotificationsContext } from 'svelte-notifications';
	import { GETArgs } from '$lib/utils';
	import { sha256 } from 'js-sha256';
	import type { Data } from "$lib/types";
	const { addNotification } = getNotificationsContext();

	export let data: Data;

	let password = '';
	let username = '';

	async function login() {
		const res = await api.get(
			data,
			`/auth${GETArgs({
				key: sha256(password).substring(0, 32),
				username
			})}`
		);
		if (!res?.body?.message) {
			window.location.href = '/home';
			return;
		}

		addNotification({
			text: res?.body?.message,
			position: 'top-center',
			type: 'error',
			removeAfter: 4000
		});
	}

	async function create() {
		const res = await api.post(data, `/users`, {
			password: sha256(password).substring(0, 32),
			username
		});
		if (res.body?.error) {
			addNotification({
				text: res.body?.error,
				position: 'top-center',
				type: 'error',
				removeAfter: 4000
			});
			return;
		}
		window.location.href = '/home';
	}
</script>

<main>
	<form class="flex-center page-center">
		<div class="content">
			<label>
				Username
				<input
					bind:value={username}
					autocomplete="username"
					style="font-size: x-large"
				/>
			</label>
			<label>
				Password
				<input
					bind:value={password}
					type="password"
					autocomplete="current-password"
					style="font-size: x-large"
				/>
			</label>
			<div class="flex-center" style="justify-content: space-between">
				<button on:click|preventDefault={create}> Sign Up </button>
				<button on:click|preventDefault={login} class="primary">
					<ChevronRight size="30" />
					Log In
				</button>
			</div>
		</div>
	</form>
</main>

<style lang="less">

	form {
		.content, form input {
			max-width: 94vw;
		}

		label {
			display: flex;
			flex-direction: column;
			margin: 1rem 0;
		}
	}
</style>