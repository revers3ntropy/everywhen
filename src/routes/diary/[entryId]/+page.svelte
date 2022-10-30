<script lang="ts">
	import Entry from '$lib/components/Entry.svelte';

	export let data: Record<string, unknown>;
</script>

<main>
	<Entry {...data} />
</main>
