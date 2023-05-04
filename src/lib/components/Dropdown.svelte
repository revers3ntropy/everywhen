<script lang="ts">
    import cn from 'classnames';

    export let open = false;
    export let ariaLabel = (open: boolean) =>
        //                                       string, not literal 'Close popup' | 'Open popup'
        (open ? 'Close popup' : 'Open popup') as string;
    export let width = '100%';
    export let fromRight = false;
    export let openOnHover = false;

    export let close = () => {
        open = false;

        if (openOnHover) {
            // make sure it's closed, then allow it to open on hover
            // after a short delay
            openOnHover = false;
            setTimeout(() => {
                openOnHover = true;
            }, 100);
        }
    };

    function globalMouseUp(evt: MouseEvent) {
        // don't close when clicking the button
        if (!(evt.target as Element).closest('.dropdown > .dropdown-button')) {
            setTimeout(close, 10);
        }
    }

    $: label = ariaLabel(open);
</script>

<svelte:window on:mouseup={globalMouseUp} />

<div
    class="dropdown {cn({
        open,
        'from-right': fromRight,
        'open-on-hover': openOnHover
    })}"
>
    <button
        aria-label={label}
        on:click={() => (open = !open)}
        class="dropdown-button"
    >
        <slot name="button" />
    </button>
    <div class="popup">
        <div class="content container" style="width: {width}">
            <slot />
        </div>
    </div>
</div>

<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/layout';

    .dropdown {
        position: relative;

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
            z-index: 15;
            display: none;
        }

        &.open,
        &.open-on-hover:hover {
            .popup {
                display: block;
            }
        }
    }

    .content {
        margin: 0;
        padding: 0;
        background: @light-accent;
    }
</style>
