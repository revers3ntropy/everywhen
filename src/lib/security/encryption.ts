import { createCipheriv, createDecipheriv } from "crypto";
import { INIT_VECTOR } from '$env/static/private';

const ALGORITHM = 'aes-256-cbc';

export function encrypt (message: string, key: string): string {
    const cipher = createCipheriv(ALGORITHM, key, INIT_VECTOR);

    let encryptedData = cipher.update(message, "utf-8", "hex");
    encryptedData += cipher.final("hex");
    return encryptedData;
}

export function decrypt (cypherText: string, key: string): string {
    const decipher = createDecipheriv(ALGORITHM, key, INIT_VECTOR);

    let decryptedData = decipher.update(cypherText, "hex", "utf-8");
    decryptedData += decipher.final("utf8");
    return decryptedData;
}