import commandLineArgs from 'command-line-args';
import crypto from 'crypto-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import { sha256 } from 'js-sha256';
import mysql from 'mysql2/promise';
import { LIMITS } from '../src/lib/constants';
import type { TimestampSecs } from '../src/types';

export const { quiet, username, password } = commandLineArgs([
    { name: 'quiet', type: Boolean, alias: 'q', defaultValue: false },
    { name: 'username', type: String, alias: 'u', defaultValue: 'test' },
    { name: 'password', type: String, alias: 'p', defaultValue: 'password' }
]) as { quiet: boolean; username: string; password: string };
const verbose = !quiet;

const envFile = fs.readFileSync(`./.env`, 'utf8');
const env = dotenv.parse<{
    PUBLIC_INIT_VECTOR: string;
    PUBLIC_SVELTEKIT_PORT: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_USER: string;
    DB_PASS: string;
    DB: string;
    PORT: string;
    HTTPS_PORT: string;
    BODY_SIZE_LIMIT: string;
}>(envFile);

const encryptionKey = crypto.enc.Utf8.parse(encryptionKeyFromPassword(password));
const wordArrayIv = crypto.enc.Utf8.parse(env.PUBLIC_INIT_VECTOR);

const dbConnection = mysql.createPool({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB,
    port: env.DB_PORT ? parseInt(env.DB_PORT) : 3306,
    multipleStatements: true,
    charset: 'utf8mb4_bin'
});

function log(...args: unknown[]) {
    if (verbose) console.log(...args);
}

async function query<T>(query: string, ...params: unknown[]): Promise<T> {
    log('query', { query, params });
    return (await dbConnection.query(query, params))[0] as T;
}

function nowUtc(rounded = true): TimestampSecs {
    const s = Date.now() / 1000;
    return rounded ? Math.floor(s) : s;
}

function encrypt(plaintext: string): string {
    const encrypted = crypto.AES.encrypt(plaintext, encryptionKey, {
        iv: wordArrayIv
    });
    return crypto.enc.Hex.stringify(encrypted.ciphertext);
}

function encryptionKeyFromPassword(pass: string): string {
    return sha256(pass).substring(0, 32);
}

async function entry(
    id: string,
    userId: string,
    created: number,
    wordCount: number,
    body: string,
    title = '',
    deleted = false
) {
    await query(
        'INSERT INTO entries (id, userId, created, createdTzOffset, latitude, longitude, title, body, labelId, deleted, pinned, agentData, wordCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        id,
        userId,
        created,
        0,
        null,
        null,
        encrypt(title),
        encrypt(body),
        null,
        deleted ? nowUtc() : null,
        null,
        encrypt(''),
        wordCount
    );
}

async function main() {
    const [{ id: userId }] = await query<{ id: string }[]>(
        'SELECT id FROM users WHERE username = ?',
        username
    );

    log('got user ID', { userId });

    await query('DELETE FROM entries WHERE userId = ?', userId);

    const years = 40;
    const entriesPerDay = 24;

    let i = 0;
    for (
        let created = nowUtc();
        created > nowUtc() - 60 * 60 * 24 * 365 * years && i < LIMITS.entry.maxCount;
        created -= 60 * 60 * (24 / entriesPerDay)
    ) {
        await entry(`my-entry-${i}`, userId, created, 2, `Entry ${i}`);
        i++;
    }
    for (
        let created = nowUtc() - 60 * 60 * 24 * 365 * years;
        created > nowUtc() - 60 * 60 * 24 * 365 * years * 2 && i < LIMITS.entry.maxCount;
        created -= 60 * 60 * 24
    ) {
        await entry(`my-entry-${i}`, userId, created, 3, `Sparse Entry ${i}`);
        i++;
    }
    log(`created ${i} entries`);

    console.log('done');
}

void main();
