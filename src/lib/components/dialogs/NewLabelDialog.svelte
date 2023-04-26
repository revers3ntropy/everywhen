<script lang="ts">
    import NewLabelForm from '../../../lib/components/NewLabelForm.svelte';
    import type { Auth } from '../../controllers/user';
    import { popup } from '../../stores';

    export let auth: Auth;

    function closeHandler() {
        popup.set(null);
    }
</script>

<div>
    <NewLabelForm {auth} on:submit={closeHandler} />
</div>
