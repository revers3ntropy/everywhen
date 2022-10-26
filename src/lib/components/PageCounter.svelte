<script lang="ts">
    import ArrowRight from 'svelte-material-icons/ArrowRight.svelte';
    import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';

    export let page = 0;
    export let pages = 0;
    export let pageLength = 0;
    export let total = 0;
</script>
<div>
    <button on:click={() => page--} disabled='{page <= 0}'>
        <ArrowLeft size="20"/>
    </button>
    Page {page+1} of {pages}
    ({Math.min((page+1) * pageLength, total)} / {total})
    <button on:click={() => page++} disabled='{page >= pages-1}'>
        <ArrowRight size="20"/>
    </button>
</div>