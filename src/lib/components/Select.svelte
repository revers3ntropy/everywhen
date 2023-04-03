<script lang="ts">
    import Dropdown from '../../lib/components/Dropdown.svelte';

    export let options: Record<string, any>;
    export let key: string;

    export let value = null;
    $: value = options[key];

    $: if (!(key in options)) key = Object.keys(options)[0];

    let close: () => void;
</script>

<Dropdown bind:close>
    <span class="selector" slot="button">
        {key}
    </span>

    <div class="options">
        {#each Object.keys(options) as option}
            <button on:click={() => { close(); key = option }}>
                {option}
            </button>
        {/each}
    </div>

</Dropdown>

<style lang="less">
    @import '../../styles/variables.less';
    @import '../../styles/layout.less';

    button {
        display: block;
        padding: .3em;
        border-radius: @border-radius;

        &:hover {
            background-color: @accent-color-primary;
            color: black;
        }
    }

    .options {
        display: flex;
        flex-direction: column;
        padding: 0;
        border: 1px solid @border-heavy;
        border-top-color: @border-light;
        border-radius: 0 0 10px 10px;
    }

    .selector {
        &:extend(button.primary);
        cursor: pointer;
        margin: 0.5em;
    }
</style>