<script context="module" lang="ts">
    let dropDownId = 0;

    export function getId(): string {
        return (dropDownId++).toString();
    }
</script>

<script lang="ts">
    const id = `__dropdown__${getId()}`;

    export let open = false;
    export let ariaLabel = (open: boolean) =>
        // as string, not literal 'Close popup' | 'Open popup'
        (open ? 'Close popup' : 'Open popup') as string;
    export let width = '100%';
    export let fromRight = false;
    export let fromTop = false;
    export let openOnHover = false;
    export let stayOpenWhenClicked = false;
    export let fillWidthMobile: boolean | 'mobile' = false;

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
        const target = evt.target as Element;

        // don't close when clicking the button
        if (target.closest(`.dropdown#${id} > .dropdown-button`)) {
            return;
        }

        // don't close when clicking inside the popup and stayOpenWhenClicked is true
        if (stayOpenWhenClicked && target.closest(`.dropdown#${id} > .popup`)) {
            return;
        }

        setTimeout(close, 10);
    }

    $: label = ariaLabel(open);
</script>

<svelte:window on:mouseup={globalMouseUp} />

<span
    class="dropdown"
    class:open
    class:from-right={fromRight}
    class:from-top={fromTop}
    class:open-on-hover={openOnHover}
    class:fill-width-mobile={fillWidthMobile}
    {id}
>
    <button aria-label={label} on:click={() => (open = !open)} class="dropdown-button">
        <slot name="button" />
    </button>
    <span class="popup">
        <span class="content container shadowed" style="--width: {width}">
            <slot />
        </span>
    </span>
</span>

<style lang="scss">
    @import '$lib/styles/layout';

    .dropdown {
        position: relative;

        .popup {
            @extend .flex-center;
            position: absolute;
            z-index: 15;
            display: none;
            top: 100%;
            left: 0;
        }
        &.from-right {
            .popup {
                right: 0;
                left: unset;
            }
        }
        &.from-top {
            .popup {
                bottom: 100%;
                top: unset;
            }
        }

        &.fill-width-mobile {
            .popup {
                @media #{$mobile} {
                    left: 0;
                    right: 0;
                    width: 100vw;
                }
            }
        }

        &.open,
        &.open-on-hover:hover {
            .popup {
                display: block;
            }
        }
    }

    .content {
        display: block;
        margin: 0;
        padding: 0;
        background: var(--light-accent);
        width: var(--width);
    }
</style>
