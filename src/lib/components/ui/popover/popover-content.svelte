<script lang="ts">
    import { theme } from '$lib/stores';
    import { Popover as PopoverPrimitive } from 'bits-ui';
    import { cn, flyAndScale } from '$lib/utils.js';

    type $$Props = PopoverPrimitive.ContentProps;

    let className: $$Props['class'] = undefined;
    export let transition: $$Props['transition'] = flyAndScale;
    export let transitionConfig: $$Props['transitionConfig'] = undefined;
    export let align: $$Props['align'] = 'center';
    export let sideOffset: $$Props['sideOffset'] = 4;
    export { className as class };
</script>

<PopoverPrimitive.Content
    {transition}
    {transitionConfig}
    {align}
    {sideOffset}
    {...$$restProps}
    class={cn(
        'bg-popover text-popover-foreground z-50 w-72 rounded-xl border-2 border-borderLight p-4 shadow-md outline-none',
        className
    )}
    data-theme={$theme}
>
    <slot />
</PopoverPrimitive.Content>
