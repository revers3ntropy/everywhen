import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';
import fs from 'fs';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const ENV = '%ENV%';
const PREV_STATE_FILE_PATH = path.join(process.env.HOME, `ew-downtime-status-${ENV}.json`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFileContent = fs.readFileSync(path.resolve(__dirname, `.env`), 'utf8');

/**
 * @type {{
 *     ROOT_URL: string;
 *     BREVO_API_KEY: string;
 *  }}
 */
const envFile = dotenv.parse(envFileContent);

/** @typedef {{ isErr: boolean, timestamp: number, env: string, apiErrCode: number, data: string }} ErrState */

const emailAPI = new TransactionalEmailsApi();
emailAPI.authentications.apiKey.apiKey = envFile['BREVO_API_KEY'];

const alertMessage = new SendSmtpEmail();
alertMessage.subject = `[EVERYWHEN ${ENV.toUpperCase()}] Downtime >1m detected`;
alertMessage.textContent = 'Everywhen has been down for longer than 1 minute';
alertMessage.sender = { name: 'Joseph Coppin', email: 'alerts@everywhen.me' };
alertMessage.to = [{ email: 'joseph.coppin@gmail.com', name: 'Joseph Coppin' }];

async function sendAlertEmail() {
    await emailAPI.sendTransacEmail(alertMessage);
}

/** @returns {ErrState | null} */
async function getCurrentState() {
    const url = `${envFile['ROOT_URL']}/api/version`;

    const res = await fetch(url);
    if (!res.ok) {
        return {
            isErr: true,
            env: ENV,
            timestamp: Date.now(),
            apiErrCode: res.status,
            data: '!res.ok'
        };
    }
    const resTxt = await res.text();
    if (resTxt) {
        return {
            isErr: true,
            env: ENV,
            timestamp: Date.now(),
            apiErrCode: res.status,
            data: resTxt
        };
    }
    try {
        const resJson = JSON.stringify(resTxt);
        if (!resJson.v) {
            return {
                isErr: true,
                env: ENV,
                timestamp: Date.now(),
                apiErrCode: res.status,
                data: resTxt
            };
        }
    } catch (e) {
        return {
            isErr: true,
            env: ENV,
            timestamp: Date.now(),
            apiErrCode: res.status,
            data: JSON.stringify(e)
        };
    }
    return null;
}

/** @return {ErrState | null} */
function getPrevState() {
    if (!fs.existsSync(PREV_STATE_FILE_PATH)) return null;
    const previousState = fs.readFileSync(PREV_STATE_FILE_PATH);
    if (!previousState) return null;
    return JSON.parse(previousState);
}

void (async () => {
    const prevState = getPrevState();
    const currentState = await getCurrentState();

    if (!prevState && !currentState) return;
    if (prevState && !currentState) {
        // clean up state file
        fs.unlinkSync(PREV_STATE_FILE_PATH);
        return;
    }
    if (!prevState && currentState) {
        fs.writeFileSync(PREV_STATE_FILE_PATH, JSON.stringify(currentState));
        return;
    }
    if (prevState && currentState) {
        // ut oh.. :(
        console.log('Downtime found, sending alert!');
        await sendAlertEmail();
        return;
    }
    console.error('invalid state', { currentState, prevState });
    process.exit(1);
})();
