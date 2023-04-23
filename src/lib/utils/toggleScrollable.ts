export interface Options {
    scrollable: boolean;
}

export function wheel (
    node: Window,
    options: Options,
) {
    let { scrollable } = options;

    const handler = (e: Event) => {
        if (!scrollable) e.preventDefault();
    };

    node.addEventListener(
        'wheel',
        handler,
        { passive: false },
    );

    node.document.body.style.overflow = scrollable ? 'auto' : 'hidden';

    return {
        update (options: Options) {
            scrollable = options.scrollable;
            node.document.body.style.overflow = scrollable ? 'auto' : 'hidden';
        },
        destroy () {
            node.document.body.style.overflow = '';
            node.removeEventListener(
                'wheel',
                handler,
                { passive: false } as EventListenerOptions,
            );
        },
    };
}