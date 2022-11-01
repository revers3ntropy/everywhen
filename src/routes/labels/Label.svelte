<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { api } from "../../lib/api/apiQuery";
    import type { Auth } from "../../lib/types";

    const dispatch = createEventDispatcher();

    export let auth: Auth;
    export let name: string;
    export let colour: string;
    export let id: string;

    async function update (changes: any) {
        await api.put(auth, `/labels/${id}`, changes);
        dispatch('updated');
    }
</script>

<div>
    <input
        type="color"
        bind:value={colour}
        on:change={() => update({ colour })}
    />
    <input
        bind:value={name}
        class="editable-text"
        autocomplete="none"
    >
</div>

<style lang="less">

</style>