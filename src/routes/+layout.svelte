<script lang="ts">
	import Header from '$lib/header/Header.svelte';
	import '../app.less';
	import { page } from "$app/stores";

	const home = $page.url.pathname.trim() === '/';
</script>

{#if !home}
	<Header />
{/if}

<main>
	<slot />
</main>

{#if !home}
	<footer>

	</footer>
{/if}
