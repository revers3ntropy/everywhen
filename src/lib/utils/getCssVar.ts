export function cssVarValue($el: Element | string, v?: string): string {
    if (!v && typeof $el === 'string') {
        const root = document.querySelector('.root');
        if (!root) throw new Error('No .root element found');
        return getComputedStyle(root).getPropertyValue($el);
    }
    if (!v) throw new Error('No css var name provided');
    if (typeof $el === 'string') {
        const el = document.querySelector($el);
        if (!el) throw new Error(`No ${$el} element found`);
        return getComputedStyle(el).getPropertyValue(v);
    }
    return getComputedStyle($el).getPropertyValue(v);
}
