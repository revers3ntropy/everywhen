<script lang="ts">
    import type { App } from '../../../app';
    import Entry from '../../../lib/components/Entry.svelte';
    import { obfuscated } from '../../../lib/constants.js';

    export let data: App.PageData;
</script>

<main>
    <Entry {...data} auth={data} obfuscated={$obfuscated} />
</main>
