<script lang="ts">
    import Send from 'svelte-material-icons/Send.svelte';
    import Entry from "$lib/components/Entry.svelte";

    export let data;
</script>
<main>
    <form>
        <input placeholder="Title"/>
        <input name="types" id="input-types" placeholder="tags"/>
        <span>
            <button type="submit" id="submit">
                <Send />
            </button>
        </span>
        <br>
        <textarea placeholder="Entry"></textarea>
    </form>
    {#each data.entries as entry}
        <Entry {...entry} />
    {/each}
</main>
