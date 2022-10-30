import { createCipheriv, createDecipheriv } from 'crypto';
import { INIT_VECTOR } from '$env/static/private';

const ALGORITHM = 'aes-256-cbc';

export function encrypt(plainText: string, key: string): string {
	if (!plainText) return '';

	const cipher = createCipheriv(ALGORITHM, key, INIT_VECTOR);

	let encryptedData = cipher.update(plainText, 'utf-8', 'hex');
	encryptedData += cipher.final('hex');
	return encryptedData;
}

export function decrypt(cypherText: string, key: string): string {
	if (!cypherText) return '';

	const decipher = createDecipheriv(ALGORITHM, key, INIT_VECTOR);

	let decryptedData = decipher.update(cypherText, 'hex', 'utf-8');
	decryptedData += decipher.final('utf8');
	return decryptedData;
}
