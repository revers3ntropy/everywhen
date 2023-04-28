<script lang="ts">
    import MenuDown from 'svelte-material-icons/MenuDown.svelte';
    import MenuUp from 'svelte-material-icons/MenuUp.svelte';
    import Dropdown from '$lib/components/Dropdown.svelte';

    export let options: Record<string, string | number>;
    export let key: string;
    export let open = false;

    export let value = null;
    $: value = options[key];

    $: if (!(key in options)) key = Object.keys(options)[0];

    let close: () => void;
</script>

<Dropdown bind:close bind:open unstyledButton>
    <span class="selector" slot="button">
        {key}
        {#if open}
            <MenuUp />
        {:else}
            <MenuDown />
        {/if}
    </span>

    <div class="options">
        {#each Object.keys(options) as option}
            <button
                on:click={() => {
                    close();
                    key = option;
                }}
            >
                {option}
            </button>
        {/each}
    </div>
</Dropdown>

<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/layout';

    button {
        display: block;
        padding: 0.3em;
        border-radius: @border-radius;
        border: none;

        &:hover {
            background-color: @accent-primary;
            color: black;
        }
    }

    .options {
        display: flex;
        flex-direction: column;
        padding: 0;
        border: 1px solid @border-heavy;
        border-top-color: @border-light;
        border-radius: @border-radius;
        background: @light-accent;

        button {
            padding: 0.4rem 1.2rem;
        }
    }

    .selector {
        &:extend(button.primary);
        cursor: pointer;
        margin: 0.5em;
    }
</style>
