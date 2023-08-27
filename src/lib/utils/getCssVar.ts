import { browser } from '$app/environment';

export function cssVarValue($el: Element | string, varName?: string): string {
    if (!browser) return '';
    if (!varName && typeof $el === 'string') {
        const root = document.querySelector('.root');
        if (!root) throw new Error('No .root element found');
        return getComputedStyle(root).getPropertyValue($el);
    }
    if (!varName) throw new Error('No css var name provided');
    if (typeof $el === 'string') {
        const el = document.querySelector($el);
        if (!el) throw new Error(`No ${$el} element found`);
        return getComputedStyle(el).getPropertyValue(varName);
    }
    return getComputedStyle($el).getPropertyValue(varName);
}
