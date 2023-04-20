import { handler } from './handler.js';
import express from 'express';
import compression from 'compression';
import fs from 'fs';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const credentials = {
    key: fs.readFileSync('./key.pem', 'utf8'),
    cert: fs.readFileSync('./cert.pem', 'utf8'),
};

const app = express();
app.use(compression());

const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app);

const HOSTNAME = '0.0.0.0';

httpServer.listen(parseInt(process.env.PORT), HOSTNAME, () => {
    console.log(`HTTP Server is running on: http://${HOSTNAME}:${process.env.PORT}`);
});

httpsServer.listen(parseInt(process.env.HTTPS_PORT), HOSTNAME, () => {
    console.log(`HTTPS Server is running on: https://${HOSTNAME}:${process.env.HTTPS_PORT}`);
});

// add a route that lives separately from the SvelteKit app
app.get('/healthcheck', (req, res) => {
    console.log('[healthcheck]');
    res.end('ok');
});

app.use((req, res, next) => {
    // let SvelteKit handle everything else, including serving pre-rendered pages and static assets
    return handler(req, res, next);
});