interface PasteOptions {
    handleText?: (text: string) => void | Promise<void>;
    handleFiles?: (files: File[] | FileList) => void | Promise<void>;
}

export function paste(element: HTMLInputElement | HTMLTextAreaElement, options: PasteOptions) {
    element.addEventListener('paste', e => {
        const event = e as ClipboardEvent;
        e.preventDefault();

        const items = event.clipboardData?.items;
        if (!items) return;

        const files = Array.from(items)
            .filter(item => item.kind === 'file')
            .map(item => item.getAsFile())
            .filter(Boolean);

        if (files.length && options.handleFiles) {
            void options.handleFiles(files);
            return;
        }

        const text = event.clipboardData?.getData('text/plain');
        if (text && options.handleText) {
            void options.handleText(text);
        }
    });
}
