<script lang="ts">
    import NewLabelForm from '$lib/components/label/NewLabelForm.svelte';
    import type { Auth } from '$lib/controllers/user/user';
    import { popup } from '$lib/stores';

    export let auth: Auth;

    function closeHandler() {
        popup.set(null);
    }
</script>

<div>
    <NewLabelForm {auth} on:submit={closeHandler} />
</div>
