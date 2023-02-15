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

	async function login (): Promise<void> {
		const res = await api.get(
			data,
			`/auth${ GETArgs({
				key: sha256(password).substring(0, 32),
				username
			}) }`
		);

		if (res?.body?.error) {
			return void addNotification({
				text: res?.body?.error,
				position: 'top-center',
				type: 'error',
				removeAfter: 4000
			});
		}
		window.location.href = "/home";
	}

	async function create (): Promise<void> {
		const res = await api.post(data, `/users`, {
			password: sha256(password).substring(0, 32),
			username
		});

		if (res.body?.error) {
			return void addNotification({
				text: res.body?.error,
				position: "top-center",
				type: "error",
				removeAfter: 4000
			});
		}
		window.location.href = "/home";
	}
</script>

<main>
	<div class="flex-center page-center form">
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
				<button
					type='button'
					on:click|preventDefault={create}
				>
					Sign Up
				</button>
				<button
					type='button'
					on:click|preventDefault={login}
					class="primary"
				>
					<ChevronRight size="30" />
					Log In
				</button>
			</div>
		</div>
	</div>
</main>

<style lang="less">

	.form {
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