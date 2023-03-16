<script lang="ts">
    import NewLabelForm from '../../../lib/components/NewLabelForm.svelte';
    import { popup } from '../../constants';
    import type { Auth } from '../../controllers/user';

    export let auth: Auth;

    async function closeHandler () {
        popup.set(null);
    }
</script>
<div>
    <NewLabelForm {auth} on:submit={closeHandler} />
</div>


