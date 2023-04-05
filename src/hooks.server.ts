import type { Handle } from '@sveltejs/kit';
import chalk from 'chalk';
import mysql from 'mysql2/promise';
import { getConfig } from './lib/db/mysql';
import { cleanupCache } from './lib/utils/cache';
import { makeLogger } from './lib/utils/log';

const reqLogger = makeLogger('REQ', chalk.grey);
const dbLogger = makeLogger('DB', chalk.yellow, 'db.log');

export let dbConnection: mysql.Connection | null = null;

export async function connect () {
    const config = await getConfig();
    dbConnection = await mysql.createConnection(config).catch((e: any) => {
        dbLogger.logToFile(`Error connecting to mysql db '${config.database}'`);
        dbLogger.logToFile(e);
        throw e;
    });
    dbLogger.logToFile(`Connected`);
}

// keep connection to database alive
// so it's not re-connected on API request
setInterval(async () => {
    if (!dbConnection) await connect();
    dbConnection?.ping();
}, 1000 * 60);

setInterval(cleanupCache, 1000 * 60);

process.on('SIGINT', process.exit);
process.on('SIGTERM', process.exit);

export const handle = (async ({ event, resolve }) => {
    const start = performance.now();
    const result = await resolve(event);
    const end = performance.now();
    reqLogger.log(
        event.request.method,
        (end - start).toPrecision(3) + 'ms',
        new URL(event.request.url).pathname,
    );
    return result;
}) satisfies Handle;

