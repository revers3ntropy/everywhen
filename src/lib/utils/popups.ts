import { bind } from 'svelte-simple-modal';
import type { SvelteComponentDev } from 'svelte/internal';
import { popup } from '../stores';

export function showPopup<T>(
    el: typeof SvelteComponentDev,
    props: Record<string, unknown>,
    onClose: () => T | void = () => void 0
) {
    const boundEl = bind(el, props);
    popup.set(boundEl);

    // not a very nice solution but I can't think of any other way
    // without creating a custom popup component which would just
    // be a pain
    const unsubscribe = popup.subscribe(value => {
        if (value === boundEl) {
            return;
        }
        unsubscribe();

        return onClose();
    });
}
