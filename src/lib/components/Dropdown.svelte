<script lang="ts">
    import cn from 'classnames';
    import MenuDown from 'svelte-material-icons/MenuDown.svelte';

    export let open = false;
    export let rounded = false;
    export let ariaLabel = '';
    export let unstyledButton = false;
    export let width = '100%';
    export let fromRight = false;
    export let openOnHover = false;

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

<div class="dropdown {cn({
    open,
    rounded,
     'unstyled': unstyledButton,
     'from-right': fromRight,
     'open-on-hover': openOnHover,
})}">
    <button
        aria-label={ariaLabel || 'Open popup'}
        on:click={() => open = !open}
    >
        <slot name="button"></slot>
        <MenuDown class="menu-down" size="30" />
    </button>
    <div class="popup">
        <div class="content" style="width: {width}">
            <slot />
        </div>
    </div>
</div>

<style lang="less">
    @import '../../styles/variables.less';
    @import '../../styles/layout.less';

    .dropdown {
        position: relative;
        width: 200px;

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

            border-radius: @border-radius;
        }

        &.unstyled {
            button {
                padding: 0;
                border-radius: 0;
                border: none;
                display: flex;
                align-items: center;
                justify-content: flex-end;

                :global(.menu-down) {
                    display: none;
                }
            }

            border: none !important;
            width: fit-content;
        }

        &.popup {
            .popup {
                left: 0;
            }
        }

        &.from-right {
            .popup {
                right: 0;
            }
        }

        .popup {
            .flex-center();
            position: absolute;
            top: 100%;
            z-index: 5;
            display: none;

            .content {
                background: @light-accent;
                border-radius: 0 0 10px 10px;
                border-top: none;
                min-width: 100%;
            }
        }

        &.rounded {
            .popup {
                transform: translateY(0.5em);

                .content {
                    border-radius: @border-radius;
                }
            }
        }

        &:not(.rounded) {
            .bordered();
            border-radius: @border-radius;
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

        &.open, &.open-on-hover:hover {
            .popup {
                display: block;
            }
        }
    }

</style>