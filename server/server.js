process.on('warning', e => console.warn(e.stack));
process.on('unhandledException', e => console.error(e.stack));
process.on('beforeExit', e => console.log('EXITING!', e.stack));

const console_log = console.log;
console.log = function (...args) {
    console_log(`[server.js]`, ...args);
};

console.log('Running');

import fs from 'fs';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';
import express from 'express';
import compression from 'compression';
import { handler } from './handler.js';

console.log('Setting up env');

dotenv.config();

console.log('Reading SSL');

const credentials = {
    key: fs.readFileSync('./key.pem', 'utf8'),
    cert: fs.readFileSync('./cert.pem', 'utf8')
};

console.log('Setting up express');

const app = express();
app.use(compression());

// add a route that lives separately from the SvelteKit app
app.get('/healthcheck', (req, res) => {
    res.end('ok');
});

app.use((req, res, next) => {
    // let SvelteKit handle everything else, including serving pre-rendered pages and static assets
    return handler(req, res, next);
});

console.log('Creating servers');

const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app);

const HOSTNAME = '0.0.0.0';

console.log('Listening');

httpServer.listen(parseInt(process.env.PORT), HOSTNAME, () => {
    console.log(`HTTP Server is running on: http://${HOSTNAME}:${process.env.PORT}`);
});

httpsServer.listen(parseInt(process.env.HTTPS_PORT), HOSTNAME, () => {
    console.log(`HTTPS Server is running on: https://${HOSTNAME}:${process.env.HTTPS_PORT}`);
});
