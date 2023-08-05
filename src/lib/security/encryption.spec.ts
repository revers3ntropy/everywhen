import { describe, it, expect } from 'vitest';
import { encrypt as encryptServer, decrypt as decryptServer } from './encryption.server';
import { encrypt as encryptClient, decrypt as decryptClient } from './encryption.client';

describe('encryption', () => {
    describe('server side', () => {
        it('encrypts and decrypts', () => {
            const key = 'k'.repeat(32);
            const plaintext = 'plaintext';
            const ciphertext = encryptServer(plaintext, key);
            const { err, val } = decryptServer(ciphertext, key);
            expect(err).toBe(null);
            expect(val).toBe(plaintext);
        });

        it('encrypts and decrypts empty string', () => {
            const key = 'k'.repeat(32);
            const plaintext = '';
            const ciphertext = encryptServer(plaintext, key);
            const { err, val } = decryptServer(ciphertext, key);
            expect(err).toBe(null);
            expect(val).toBe(plaintext);
        });

        it('encrypts and decrypts with different keys', () => {
            const key1 = 'k'.repeat(32);
            const key2 = 'l'.repeat(32);
            const plaintext = 'plaintext';
            const ciphertext = encryptServer(plaintext, key1);
            const { err, val } = decryptServer(ciphertext, key2);
            expect(typeof err).toBe('string');
            expect(!!val).toBe(false);
        });
    });

    describe('client side', () => {
        it('encrypts and decrypts', () => {
            const key = 'k'.repeat(32);
            const plaintext = 'plaintext';
            const ciphertext = encryptClient(plaintext, key);
            const { err, val } = decryptClient(ciphertext, key);
            expect(err).toBe(null);
            expect(val).toBe(plaintext);
        });

        it('encrypts and decrypts empty string', () => {
            const key = 'k'.repeat(32);
            const plaintext = '';
            const ciphertext = encryptClient(plaintext, key);
            const { err, val } = decryptClient(ciphertext, key);
            expect(err).toBe(null);
            expect(val).toBe(plaintext);
        });

        it('encrypts and decrypts with different keys', () => {
            const key1 = 'k'.repeat(32);
            const key2 = 'l'.repeat(32);
            const plaintext = 'plaintext';
            const ciphertext = encryptClient(plaintext, key1);
            const { err, val } = decryptClient(ciphertext, key2);
            expect(typeof err).toBe('string');
            expect(!!val).toBe(false);
        });
    });
});
