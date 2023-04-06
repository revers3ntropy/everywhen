import type { Handle } from '@sveltejs/kit';
import chalk from 'chalk';
import { connect, dbConnection } from './lib/db/mysql';
import { cleanupCache } from './lib/utils/cache';
import { makeLogger } from './lib/utils/log';

export const errorLogger = makeLogger('ERR', chalk.red, 'error.log');
const reqLogger = makeLogger('REQ', chalk.grey);

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
    let result: Response;
    try {
        result = await resolve(event);
    } catch (e) {
        errorLogger.logToFile(e);
        result = new Response('An Error has Occurred', {
            status: 500,
        });
    }
    const end = performance.now();
    reqLogger.log(
        event.request.method,
        (end - start).toPrecision(3) + 'ms',
        new URL(event.request.url).pathname,
    );
    return result;
}) satisfies Handle;

