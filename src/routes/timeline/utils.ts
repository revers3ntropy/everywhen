export {};

// src: https://awik.io/determine-color-bright-dark-using-javascript/
// function isLightColour (color: string): boolean {
//     let r: number, g: number, b: number;
//
//     if (color.match(/^rgb/)) {
//         const c = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
//         if (!c) throw new Error("Invalid color: " + color);
//         r = parseInt(c[1]);
//         g = parseInt(c[2]);
//         b = parseInt(c[3]);
//     } else {
//         const c = +("0x" + color.slice(1)
//                 .replace((color.length < 5) as any && /./g, "$&$&")
//         );
//         r = c >> 16;
//         g = c >> 8 & 255;
//         b = c & 255;
//     }
//     const hsp = Math.sqrt(
//         0.299 * (r * r) +
//         0.587 * (g * g) +
//         0.114 * (b * b)
//     );
//     return hsp > 127.5;
// }
//
// export function eventsOverlap (evt1: Event, evt2: Event): boolean {
//     return evt1.start <= evt2.start && evt1.end >= evt2.start ||
//         evt2.start <= evt1.start && evt2.end >= evt1.start;
// }
//
// export function eventDuration (e: Event): number {
//     return e.end - e.start;
// }