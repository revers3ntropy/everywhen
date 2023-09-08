import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './encryption';

function expectFalse(val: boolean): asserts val is false {
    expect(val).toBe(false);
}

describe('encryption', () => {
    it('encrypts and decrypts', () => {
        const key = 'k'.repeat(32);
        const plaintext = 'plaintext';
        const ciphertext = encrypt(plaintext, key);
        decrypt(ciphertext, key).match(
            val => expect(val).toBe(plaintext),
            err => expect(err).toBe(null)
        );
    });

    it('encrypts and decrypts empty string', () => {
        const key = 'k'.repeat(32);
        const plaintext = '';
        const ciphertext = encrypt(plaintext, key);
        decrypt(ciphertext, key).match(
            val => expect(val).toBe(plaintext),
            err => expect(err).toBe(null)
        );
    });

    it('encrypts and decrypts with different keys', () => {
        const key1 = 'k'.repeat(32);
        const key2 = 'l'.repeat(32);
        const plaintext = 'plaintext';
        const ciphertext = encrypt(plaintext, key1);
        const decryptRes = decrypt(ciphertext, key2);
        expectFalse(decryptRes.ok);
        expect(typeof decryptRes.err).toBe('string');
    });

    it('fails to decrypt random string', () => {
        const key1 = 'k'.repeat(32);
        const ciphertext = 'this is not a valid ciphertext';
        const decryptRes = decrypt(ciphertext, key1);
        expectFalse(decryptRes.ok);
        expect(typeof decryptRes.err).toBe('string');
    });

    it('decrypts empty ciphertext as empty plaintext', () => {
        const key = 'k'.repeat(32);
        decrypt('', key).match(
            val => expect(val).toBe(''),
            err => expect(err).toBe(null)
        );
    });
});
