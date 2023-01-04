import { handler } from './handler.js';
import express from 'express';
import fs from 'fs';
import https from 'https';
import http from 'http';

const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');
const credentials = {
    key: privateKey,
    cert: certificate
};

const app = express();
const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app);

const HTTPS_PORT = 18890;
const HTTP_PORT = 18891;

httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`HTTP Server is running on: https://localhost:${HTTP_PORT}`);
});

httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`HTTPS Server is running on: https://localhost:${HTTPS_PORT}`);
});

// add a route that lives separately from the SvelteKit app
app.get('/healthcheck', (req, res) => {
    res.end('ok');
});

app.use((req, res, next) => {
    console.log(`EXPRESS [${req.method}] ${req.url}`);
    // let SvelteKit handle everything else, including serving pre-rendered pages and static assets
    return handler(req, res, next);
});