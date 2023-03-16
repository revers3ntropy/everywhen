<script lang="ts">
    import MenuDown from 'svelte-material-icons/MenuDown.svelte';

    export let open = false;
    export let rounded = false;
    export let ariaLabel = '';

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

<svelte:window on:mousedown={globalMouseDown} />

<div class="dropdown {open ? 'open' : ''} {rounded ? 'rounded' : ''}">
    <button aria-label={ariaLabel || 'Open popup'} on:click={() => open = !open}>
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
    @import '../../styles/layout.less';

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

        border-radius: 10px;
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
        z-index: 5;

        .content {
            background: @light-accent;
            border-radius: 0 0 10px 10px;
            border-top: none;
        }
    }

    .rounded {
        .popup {
            transform: translateY(0.5em);

            .content {
                border-radius: 10px;
            }
        }
    }

    :not(.rounded).dropdown {
        .bordered();
        border-radius: 10px;
        margin: .5em;

        &:hover {
            background: @light-v-accent;
        }

        &.open {
            background: @light-accent;
            border-radius: 10px 10px 0 0;
            border: 1px solid @border-heavy;
        }
    }
</style>