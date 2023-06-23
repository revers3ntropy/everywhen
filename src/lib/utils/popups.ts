import type { SvelteComponent } from 'svelte';
import { bind } from 'svelte-simple-modal';
import { popup } from '../stores';

export function showPopup(
    el: typeof SvelteComponent<
        Record<string, unknown>,
        Record<string, unknown>,
        Record<string, unknown>
    >,
    props: Record<string, unknown>,
    onClose: () => Promise<boolean | void> | boolean | void = () => void 0
) {
    const boundEl = bind(el as typeof SvelteComponent, props);
    popup.set(boundEl);

    // not a very nice solution but I can't think of any other way
    // without creating a custom popup component which would just
    // be a pain
    const unsubscribe = popup.subscribe(value => {
        if (value === boundEl) {
            return;
        }

        const onCloseResult = onClose();

        if (typeof onCloseResult === 'boolean' && onCloseResult) {
            popup.set(value);
            return;
        }

        if (onCloseResult instanceof Promise) {
            void onCloseResult.then(result => {
                if (result) {
                    popup.set(value);
                } else {
                    unsubscribe();
                }
            });
            return;
        }

        unsubscribe();
    });
}
