<script lang="ts">
    import MenuDown from 'svelte-material-icons/MenuDown.svelte';
    import MenuUp from 'svelte-material-icons/MenuUp.svelte';
    import Dropdown from '$lib/components/ui/Dropdown.svelte';

    export let fromRight = false;
    export let options: Record<string, string | number>;
    export let key: string;
    export let open = false;
    export let onChange: null | ((key: string, oldKey: string) => void) = null;

    export let value = options[key];
    $: value = options[key];

    $: if (!(key in options)) key = Object.keys(options)[0];
</script>

<Dropdown bind:open {fromRight}>
    <span class="selector" slot="button">
        {key}
        {#if open}
            <MenuUp size="22" />
        {:else}
            <MenuDown size="22" />
        {/if}
    </span>

    <div class="options">
        {#each Object.keys(options) as option}
            <button
                class="option"
                on:click={() => {
                    open = false;
                    if (onChange && key !== option) onChange(option, key);
                    key = option;
                }}
            >
                {option}
            </button>
        {/each}
    </div>
</Dropdown>

<style lang="scss">
    @import '$lib/styles/layout';

    .selector {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
    }

    .options {
        display: flex;
        flex-direction: column;
        padding: 0.5rem 0;
        border-radius: $border-radius;
        background: var(--light-accent);
        min-width: 100px;

        button.option {
            display: block;
            padding: 0.4em 0.8rem;
            border: none;
            text-align: left;

            &:hover {
                background-color: var(--v-light-accent);
            }
        }
    }
</style>
