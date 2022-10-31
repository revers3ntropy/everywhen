<svelte:window on:mousedown={globalMouseDown}/>
<script lang="ts">
    import MenuDown from 'svelte-material-icons/MenuDown.svelte';
    export let value;
    export let open = false;

    export let close = () => {
    	open = false;
    };

    function globalMouseDown (evt: MouseEvent) {
    	if (open && !(evt.target as Element).closest('.dropdown')) {
    		close();
            evt.preventDefault();
    	}
    }
</script>
<div class="dropdown">
    <button on:click={() => open = !open}>
        <slot name="button"></slot>
        <MenuDown size="30" />
    </button>
    {#if open}
        <div class="popup">
            <div class="content">
                <slot />
            </div>
        </div>
    {/if}
</div>
<style lang="less">
    @import '../../styles/variables.less';

    button {
        background: none;
        border: none;
        padding: 0 0.2em;
        font: inherit;
        cursor: pointer;
        outline: inherit;
        display: inline-grid;
        width: 100%;
        grid-template-columns: 1fr 30px;
        justify-content: space-between;
        align-items: center;
    }

    div {
        position: relative;
        width: 200px;
    }

    .popup {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translateY(0.5em);

        .content {
            background: @light-accent;
            border-radius: 10px;
        }
    }
</style>