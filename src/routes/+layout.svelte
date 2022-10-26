<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Notifications from 'svelte-notifications';
	import '../app.less';
	import { page } from "$app/stores";
	import { browser } from "$app/environment";
	import { api } from "../lib/api/apiQuery";

	const home = $page.url.pathname.trim() === '/';

	if (browser) {
		api.get('/auth')
			.then((res) => {
				if (!home && res.status === 401) {
					window.location.href = '/';
					return;
				}
				if (home && res.status === 200) {
					window.location.href = '/home';
				}
			});
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