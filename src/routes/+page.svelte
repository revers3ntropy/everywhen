<script lang="ts">
	import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
	import { api } from '../lib/api/apiQuery';
	import { getNotificationsContext } from 'svelte-notifications';
	import { GETArgs } from '../lib/utils';
	import { sha256 } from 'js-sha256';
	const { addNotification } = getNotificationsContext();

	export let data: Record<string, any>;

	let password = '';
	let username = '';

	async function login() {
		const res = await api.get(
			data.key,
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
		const res = await api.post(data.key, `/users`, {
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

<svelte:head>
	<title>Me</title>
	<meta name="description" content="Diary" />
</svelte:head>
<section>
	<h1>Welcome to me.revers3ntropy.com!</h1>

	<form class="flex-center page-center">
		<div>
			<p>
				<input
					bind:value={username}
					placeholder="Username"
					autocomplete="username"
					style="font-size: x-large"
				/>
			</p>
			<p>
				<input
					bind:value={password}
					type="password"
					placeholder="Key"
					autocomplete="current-password"
					style="font-size: x-large"
				/>
			</p>
			<div class="flex-center" style="justify-content: space-between">
				<button on:click|preventDefault={create}> Sign Up </button>
				<button on:click|preventDefault={login} class="primary">
					<ChevronRight size="30" />
					Log In
				</button>
			</div>
		</div>
	</form>
</section>
