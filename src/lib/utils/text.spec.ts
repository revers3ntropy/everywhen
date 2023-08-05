// import { describe, it, expect } from 'vitest';
// import { obfuscate, wordCount } from './text';
//
// describe('obfuscate', () => {
//     it('changes the string', () => {
//         const text = 'hello world';
//         expect(obfuscate(text)).not.toBe(text);
//     });
// });
//
// describe('wordCount', () => {
//     it('Splits words correctly', () => {
//         expect(wordCount('')).toBe(0);
//         expect(wordCount(' ')).toBe(0);
//         expect(wordCount(' -')).toBe(0);
//         expect(wordCount('hi')).toBe(1);
//         expect(wordCount('hello!')).toBe(1);
//         expect(wordCount(`there's`)).toBe(1);
//         expect(wordCount(`there's not a thing`)).toBe(4);
//         expect(wordCount(`there's not a thing!`)).toBe(4);
//         expect(wordCount(`there's not-like a thing!`)).toBe(5);
//         expect(wordCount(`Although, I'd say...`)).toBe(3);
//         expect(wordCount(`Although, I'd say...`)).toBe(3);
//         expect(wordCount(`Although, I'd say ...`)).toBe(3);
//         expect(wordCount(`yes   a       !`)).toBe(2);
//     });
// });
