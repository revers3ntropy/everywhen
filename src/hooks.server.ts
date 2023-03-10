import { con, connect } from './lib/db/mysql';

process.on('SIGINT', process.exit);
process.on('SIGTERM', process.exit);

setInterval(async () => {
    if (!con) await connect();
    con?.ping();
}, 1000 * 60);