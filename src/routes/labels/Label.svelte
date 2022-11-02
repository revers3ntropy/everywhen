<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { api } from "../../lib/api/apiQuery";
    import type { Auth } from "../../lib/types";

    const dispatch = createEventDispatcher();

    export let auth: Auth;
    export let name: string;
    export let colour: string;
    export let id: string;
    export let editable = true;
    export let created;

    async function update (changes: any) {
        await api.put(auth, `/labels/${id}`, changes);
        dispatch('updated');
    }
</script>

{#if editable}
    <div class="label editable">
        <input
            type="color"
            bind:value={colour}
            on:change={() => update({ colour })}
        />
        <input
            bind:value={name}
            class="editable-text"
            autocomplete="none"
            on:change={() => update({ name })}
        >
    </div>
{:else}
    <div class="label">
        <div class="entry-label-colour"
              style="background: {colour}"
        ></div>
        <div>{name}</div>
    </div>
{/if}

<style lang="less">
    .label {
        margin: 0.5em;
        display: grid;
        grid-template-columns: 25px 1fr;
        justify-content: left;
        align-items: center;

        &.editable {
            grid-template-columns: 60px 1fr;
        }
    }
</style>