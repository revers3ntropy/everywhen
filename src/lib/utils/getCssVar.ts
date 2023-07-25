export function cssVaValue(canvas: HTMLCanvasElement, v: string): string {
    return getComputedStyle(canvas).getPropertyValue(v);
}