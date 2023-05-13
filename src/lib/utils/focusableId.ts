import { page } from '$app/stores';

export function focusableId(
    element: HTMLElement,
    {
        id,
        overrideInputFocus = false
    }: { id: string; overrideInputFocus?: boolean }
) {
    const unsubscribe = page.subscribe(page => {
        if (page.url.hash.length < 2) return;
        if (page.url.hash.substring(1) !== id) return;
        if (!overrideInputFocus) {
            const focused = document.activeElement;
            if (focused instanceof HTMLInputElement) return;
            if (focused instanceof HTMLTextAreaElement) return;
        }
        element.tabIndex = -1;
        element.focus({
            preventScroll: false
        });
    });

    return {
        destroy() {
            unsubscribe();
        }
    };
}
