import type { RenderProps, SetupCallback } from './canvasHelpers';

export interface Interactable {
    onHover?: (x: number, y: number) => void;
    onClick?: (x: number, y: number) => void;
    render?: (
        props: RenderProps,
        hover: boolean,
        dt: number
    ) => void | Promise<void>;
    setup?: SetupCallback;
}

export function interactable (
    _interactable: Interactable
): void {
    // const api: CanvasContext = getContext(key);
    // const element = {
    //     ready: false,
    //     mounted: false,
    //     ...interactable
    // } as Listener;
    //
    // void api.add(element);
    // onMount(() => {
    //     element.mounted = true;
    //     return () => {
    //         api.remove(element);
    //         element.mounted = false;
    //     };
    // });
}