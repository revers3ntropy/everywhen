import type { Handle } from '@sveltejs/kit';
import chalk from 'chalk';
import mysql from 'mysql2/promise';
import { getConfig } from './lib/db/mysql';
import { makeLogger } from './lib/utils/log';

const reqLogger = makeLogger('REQ', chalk.grey);
const dbLogger = makeLogger('DB', chalk.yellow);

export let dbConnection: mysql.Connection | null = null;

export async function connect () {
    const config = await getConfig();
    dbConnection = await mysql.createConnection(config).catch((e: any) => {
        dbLogger.error(`Error connecting to mysql db '${config.database}'`);
        dbLogger.error(e);
        throw e;
    });
    dbLogger.log(`Connected`);
}

// keep connection to database alive
// so it's not re-connected on API request
setInterval(async () => {
    if (!dbConnection) await connect();
    dbConnection?.ping();
}, 1000 * 60);

process.on('SIGINT', process.exit);
process.on('SIGTERM', process.exit);

export const handle = (async ({ event, resolve }) => {
    reqLogger.log(
        event.request.method,
        new URL(event.request.url).pathname,
    );
    return resolve(event);
}) satisfies Handle;

