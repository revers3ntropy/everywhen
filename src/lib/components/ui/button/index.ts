import { type VariantProps, tv } from 'tailwind-variants';
import type { Button as ButtonPrimitive } from 'bits-ui';
import Root from './button.svelte';

const buttonVariants = tv({
    base: 'inline-flex items-center justify-space-between rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variants: {
        variant: {
            default: 'bg-lightAccent hover:bg-vLightAccent',
            destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            outline:
                'border border-borderHeavy border-solid bg-transparent hover:bg-accent hover:text-accent-foreground icon-gradient-on-hover',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            ghost: 'hover:bg-accent hover:text-accent-foreground',
            link: 'text-primary underline-offset-4 hover:underline'
        },
        size: {
            default: 'h-10 px-4 py-2',
            sm: 'h-9 rounded-md px-3',
            lg: 'h-11 rounded-md px-8',
            icon: 'h-10 w-10'
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'default'
    }
});

type Variant = VariantProps<typeof buttonVariants>['variant'];
type Size = VariantProps<typeof buttonVariants>['size'];

type Props = ButtonPrimitive.Props & {
    variant?: Variant;
    size?: Size;
};

type Events = ButtonPrimitive.Events;

export {
    Root,
    type Props,
    type Events,
    //
    Root as Button,
    type Props as ButtonProps,
    type Events as ButtonEvents,
    buttonVariants
};
