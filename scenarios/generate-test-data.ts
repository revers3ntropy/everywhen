import type { Connection, RowDataPacket } from 'mysql2/promise';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import type { Scenario } from './scenarios.js';
import { scenarios } from './scenarios.js';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto-js';
import { sha256 } from 'js-sha256';
import { ENCRYPTED_TEXT_PREFIX } from '../src/lib/constants';
import { Day } from '../src/lib/utils/day';
import c from 'chalk';

// Load environment variables from ../.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// --- UTILITY FUNCTIONS ---

function encrypt(plaintext: string, key: string): string {
    const encrypted = crypto.AES.encrypt(plaintext, crypto.enc.Utf8.parse(key), {
        iv: wordArrayIv
    });
    return crypto.enc.Hex.stringify(encrypted.ciphertext);
}

function encryptOptionallyEncryptedField(plaintext: string, key: string): string {
    return `${ENCRYPTED_TEXT_PREFIX}${encrypt(plaintext, key)}`;
}

function encryptionKeyFromPassword(pass: string): string {
    return sha256(pass).substring(0, 32);
}

const wordArrayIv = crypto.enc.Utf8.parse(process.env['PUBLIC_INIT_VECTOR'] ?? '');

/**
 * Generates a 32-character ID without dashes.
 * @returns {string} A 32-character UUID.
 */
const generateId = (): string => uuidv4().replace(/-/g, '');

/**
 * Creates a Unix timestamp for the current time.
 * @returns {number} The current time as a Unix timestamp in seconds.
 */
const now = (): number => Math.floor(Date.now() / 1000);

// --- DATA FINDING/GENERATION FUNCTIONS ---

/**
 * Finds a user by their username and password.
 * @param {Connection} connection - The database connection object.
 * @param {string} username - The user's username.
 * @param {string} key - The user's encryption key, generated from their password
 * @returns {Promise<string | null>} The user's ID if found, otherwise null.
 */
async function findUserByCredentials(
    connection: Connection,
    username: string,
    key: string
): Promise<string | null> {
    console.log(c.gray(`Searching for user: ${username}`));
    // IMPORTANT: This is a plain-text password check, suitable only for a test script.
    // A real application would use a secure hashing and comparison mechanism (e.g., bcrypt).
    const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE username = ? AND password = SHA2(CONCAT(?, salt), 256) LIMIT 1',
        [username, key]
    );

    if (rows.length > 0) {
        const userId = rows[0]['id'];
        console.log(c.green`  -> Found user with ID:`, c.cyan(userId));
        return userId;
    }

    console.log(c.red(`  -> User not found or password incorrect.`));
    return null;
}

async function createLabels(
    connection: Connection,
    key: string,
    userId: string,
    count: number
): Promise<string[]> {
    if (count === 0) return [];
    const labelIds: string[] = [];
    for (let i = 0; i < count; i++) {
        const labelId = generateId();
        const label = {
            id: labelId,
            userId: userId,
            name: encryptOptionallyEncryptedField(faker.lorem.word(), key),
            color: faker.color.rgb(),
            created: now()
        };
        await connection.execute(
            'INSERT INTO labels (id, userId, name, color, created) VALUES (?, ?, ?, ?, ?)',
            Object.values(label)
        );
        labelIds.push(labelId);
    }
    console.log(c.gray(`    - Created ${count} labels.`));
    return labelIds;
}

async function createEntries(
    connection: Connection,
    key: string,
    userId: string,
    entryCount: number,
    editsPerEntry: number,
    labelIds: string[]
): Promise<void> {
    if (entryCount === 0) return;
    for (let i = 0; i < entryCount; i++) {
        const entryId = generateId();
        const body = faker.lorem.paragraphs(3);
        const wordCount = body.split(/\s+/).length;

        const created = now() - 60 * 60 * 24 * i;

        const entry = {
            id: entryId,
            userId,
            created,
            createdTzOffset: 0,
            day: Day.fromTimestamp(created, 0).fmtIso(),
            // random location in the south eath of the UK
            latitude: 52.3946613 + (Math.random() - 0.5) * 0.8,
            longitude: 0.2557761 + (Math.random() - 0.5) * 2,
            title: encrypt(faker.lorem.sentence(), key),
            body: encrypt(body, key),
            labelId: labelIds.length > 0 ? faker.helpers.arrayElement(labelIds) : null,
            deleted: null,
            pinned: faker.helpers.arrayElement([null, now()]),
            agentData: encrypt(JSON.stringify({ device: 'ts-test-script', version: '1.0' }), key),
            wordCount: wordCount
        };

        await connection.execute(
            'INSERT INTO entries (id, userId, created, createdTzOffset, day, latitude, longitude, title, body, labelId, deleted, pinned, agentData, wordCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            Object.values(entry)
        );

        await createEntryEdits(connection, key, userId, entryId, editsPerEntry, created);
        await createWordsInEntry(connection, key, userId, entryId, body);

        if (i % 1000 === 0 && i > 0) {
            console.log(c.grey(`        - Create entries progress: ${i}/${entryCount}`));
        }
    }
    console.log(c.gray(`    - Created ${entryCount} entries.`));
}

async function createEntryEdits(
    connection: Connection,
    key: string,
    userId: string,
    entryId: string,
    count: number,
    entryCreated: number
): Promise<void> {
    if (count === 0) return;
    for (let i = 0; i < count; i++) {
        const edit = {
            id: generateId(),
            userId: userId,
            entryId: entryId,
            created: entryCreated + 60 * i,
            createdTzOffset: 0,
            latitude: 52.3946613 + (Math.random() - 0.5) * 0.8,
            longitude: 0.2557761 + (Math.random() - 0.5) * 2,
            agentData: encrypt(
                JSON.stringify({ device: 'ts-test-script-edit', version: '1.0' }),
                key
            ),
            oldTitle: encrypt(faker.lorem.sentence(), key),
            oldBody: encrypt(faker.lorem.paragraphs(2), key),
            oldLabelId: null
        };
        await connection.execute(
            'INSERT INTO entryEdits (id, userId, entryId, created, createdTzOffset, latitude, longitude, agentData, oldTitle, oldBody, oldLabelId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            Object.values(edit)
        );
    }
}

async function createWordsInEntry(
    connection: Connection,
    key: string,
    userId: string,
    entryId: string,
    bodyText: string
): Promise<void> {
    const wordMap = new Map<string, number>();
    const words = bodyText.toLowerCase().match(/\b\w+\b/g) || [];

    for (const word of words) {
        wordMap.set(word, (wordMap.get(word) || 0) + 1);
    }

    for (const [word, count] of wordMap.entries()) {
        const wordInEntry = {
            userId: userId,
            entryId: entryId,
            entryIsDeleted: 0,
            word: encrypt(word.substring(0, 255), key),
            count: count
        };
        await connection.execute(
            'INSERT INTO wordsInEntries (userId, entryId, entryIsDeleted, word, count) VALUES (?, ?, ?, ?, ?)',
            Object.values(wordInEntry)
        );
    }
}

async function createAssets(
    connection: Connection,
    key: string,
    userId: string,
    count: number
): Promise<void> {
    if (count === 0) return;
    for (let i = 0; i < count; i++) {
        const asset = {
            id: generateId(),
            publicId: uuidv4(),
            userId: userId,
            created: now(),
            fileName: encrypt(faker.system.fileName(), key),
            content: encrypt(faker.image.dataUri(), key)
        };
        await connection.execute(
            'INSERT INTO assets (id, publicId, userId, created, fileName, content) VALUES (?, ?, ?, ?, ?, ?)',
            Object.values(asset)
        );
    }
    console.log(c.gray(`    - Created ${count} assets.`));
}

interface Config {
    credentials: {
        username: string;
        password: string;
    };
    scenarioKey: string;
}

async function getConfigFromUserInput(): Promise<Config> {
    const credentials = await inquirer.prompt([
        {
            type: 'input',
            name: 'username',
            message: 'Username for the account to populate:',
            default: 'test'
        },
        {
            type: 'input',
            name: 'password',
            message: 'Password:',
            default: 'password'
        }
    ]);

    const { scenarioKey } = await inquirer.prompt([
        {
            type: 'list',
            name: 'scenarioKey',
            message: 'Which scenario would you like to run?',
            choices: Object.keys(scenarios).map(key => ({
                name: `${key}: ${scenarios[key].description}`,
                value: key
            }))
        }
    ]);

    return { scenarioKey, credentials };
}

// --- MAIN EXECUTION LOGIC ---

/**
 * The main function to run the script.
 */
async function main() {
    console.log('Starting TypeScript Test Data Generator...');

    const { scenarioKey, credentials } = await getConfigFromUserInput();

    const scenario: Scenario = scenarios[scenarioKey];
    console.log(c.gray(`\nRunning scenario: ${scenarioKey}`));

    let connection: Connection | undefined;
    try {
        connection = await mysql.createConnection({
            host: process.env['DB_HOST'],
            port: parseInt(process.env['DB_PORT'] || '3306', 10),
            user: process.env['DB_USER'],
            password: process.env['DB_PASSWORD'],
            database: process.env['DB'],
            charset: 'utf8mb4_bin'
        });

        console.log(c.green('Successfully connected to database'));

        const encryptionKey = encryptionKeyFromPassword(credentials.password);
        const userId = await findUserByCredentials(connection, credentials.username, encryptionKey);

        if (!userId) {
            console.error(c.red('\nExecution halted: Could not find user'));
            return;
        }

        await connection.beginTransaction();
        console.log(c.gray(`Transaction started.`));

        await Promise.all([
            connection.execute('DELETE FROM assets WHERE userId = ?', [userId]),
            connection.execute('DELETE FROM entries WHERE userId = ?', [userId]),
            connection.execute('DELETE FROM entryEdits WHERE userId = ?', [userId]),
            connection.execute('DELETE FROM wordsInEntries WHERE userId = ?', [userId]),
            connection.execute('DELETE FROM labels WHERE userId = ?', [userId])
        ]);

        console.log(c.green(`Cleared data successfully`));

        console.log(c.gray(`\nGenerating data for '${credentials.username}'...`));
        const labelIds = await createLabels(connection, encryptionKey, userId, scenario.labelCount);

        await Promise.all([
            createEntries(
                connection,
                encryptionKey,
                userId,
                scenario.entryCount,
                scenario.editsPerEntry,
                labelIds
            ),
            createAssets(connection, encryptionKey, userId, scenario.assetCount)
        ]);

        await connection.commit();
        console.log(c.green('\nTransaction committed successfully'));
    } catch (error: unknown) {
        console.error(c.red('\nAn error occurred:'), (error as { message: string }).message);
        if (connection) {
            console.log('Rolling back transaction...');
            await connection.rollback();
            console.log('Transaction rolled back.');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log(c.gray(`Database connection closed.`));
        }
    }
}

main();
