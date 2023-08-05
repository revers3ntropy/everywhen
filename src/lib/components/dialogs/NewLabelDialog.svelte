<script lang="ts">
    import NewLabelForm from '$lib/components/label/NewLabelForm.svelte';
    import { popup } from '$lib/stores';

    function closeHandler() {
        popup.set(null);
    }
</script>

<div>
    <NewLabelForm on:submit={closeHandler} />
</div>
