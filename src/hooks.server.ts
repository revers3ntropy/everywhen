import type { Handle } from '@sveltejs/kit';
import { con, connect } from './lib/db/mysql';

process.on('SIGINT', process.exit);
process.on('SIGTERM', process.exit);

// keep connection to database alive
// so it's not re-connected on API request
setInterval(async () => {
    if (!con) await connect();
    con?.ping();
}, 1000 * 60);

function logRequest (req: Request) {
    console.log(new Date().toLocaleTimeString()
        + ' ' + req.method.padEnd(6, ' ')
        + ' ' + new URL(req.url).pathname);
}

export const handle = (async ({ event, resolve }) => {
    logRequest(event.request);
    return resolve(event);
}) satisfies Handle;