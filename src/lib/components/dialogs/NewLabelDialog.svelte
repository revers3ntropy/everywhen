<script lang="ts">
    import { popup } from "$lib/constants";
    import type { Auth } from "$lib/types";
    import NewLabelForm from "$lib/components/NewLabelForm.svelte";

    export let auth: Auth;

    async function closeHandler () {
        popup.set(null);
    }
</script>
<div>
    <NewLabelForm {auth} on:submit={closeHandler} />
</div>


