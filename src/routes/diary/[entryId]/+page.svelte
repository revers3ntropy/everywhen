<script lang="ts">
    import Entry from "$lib/components/Entry.svelte";
    import type { Auth } from "$lib/types";
    import { obfuscated } from "$lib/constants.js";

    export let data: Auth;
</script>

<main>
    <Entry {...data} obfuscated={$obfuscated} />
</main>
