<script lang="ts">
    import MenuDown from 'svelte-material-icons/MenuDown.svelte';
    import MenuUp from 'svelte-material-icons/MenuUp.svelte';
    import Dropdown from '$lib/components/Dropdown.svelte';

    export let fromRight = false;
    export let options: Record<string, string | number>;
    export let key: string;
    export let open = false;

    export let value = null;
    $: value = options[key];

    $: if (!(key in options)) key = Object.keys(options)[0];
</script>

<Dropdown bind:open fromRight>
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

    .selector {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
    }

    .options {
        display: flex;
        flex-direction: column;
        padding: 0.5rem 0;
        border-radius: @border-radius;
        background: @light-accent;
        min-width: 100px;

        button.option {
            display: block;
            padding: 0.4em 0.8rem;
            border: none;
            text-align: left;

            &:hover {
                background-color: @light-v-accent;
            }
        }
    }
</style>
