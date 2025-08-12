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

/** @typedef {{
 *     isErr: boolean,
 *     timestamp: number,
 *     env: string,
 *     apiErrCode: number,
 *     data: string,
 *     emailSent: boolean
 * }} ErrState */

const emailAPI = new TransactionalEmailsApi();
emailAPI.authentications.apiKey.apiKey = envFile['BREVO_API_KEY'];

const alertMessage = new SendSmtpEmail();
alertMessage.subject = `[EVERYWHEN ${ENV.toUpperCase()}] Downtime detected`;
alertMessage.textContent = `Everywhen ${envFile['ROOT_URL']} (env=${ENV.toUpperCase()}) is unreachable`;
alertMessage.sender = { name: 'Joseph Coppin', email: 'alerts@everywhen.me' };
alertMessage.to = [{ email: 'joseph.coppin@gmail.com', name: 'Joseph Coppin' }];

async function sendAlertEmail() {
    console.log('SENDING EMAIL');
    emailAPI
        .sendTransacEmail(alertMessage)
        .then(res => {
            console.log(JSON.stringify(res.body));
        })
        .catch(err => {
            console.error('Error sending email:', err.body);
        });
}

/** @returns {ErrState | null} */
async function getCurrentState() {
    const url = `${envFile['ROOT_URL']}/api/version`;

    const res = await fetch(url);
    if (!res.ok) {
        console.log('res was not ok', res);
        return {
            isErr: true,
            env: ENV,
            timestamp: Date.now(),
            apiErrCode: res.status,
            data: '!res.ok'
        };
    }
    const resTxt = await res.text();
    if (!resTxt) {
        console.error('no text response found', resTxt);
        return {
            isErr: true,
            env: ENV,
            timestamp: Date.now(),
            apiErrCode: res.status,
            data: `resTxt:${resTxt}`
        };
    }
    try {
        const resJson = JSON.parse(resTxt);
        if (!resJson.v) {
            console.error('no resJson.v found', resJson);
            return {
                isErr: true,
                env: ENV,
                timestamp: Date.now(),
                apiErrCode: res.status,
                data: `resJson.v:${resTxt}`
            };
        }
    } catch (e) {
        console.log('could not parse JSON');
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

    if (!prevState && !currentState) {
        console.log('all ok');
        return;
    }
    if (prevState && !currentState) {
        console.log('Downtime resolved');
        // clean up state file
        fs.unlinkSync(PREV_STATE_FILE_PATH);
        return;
    }
    if (!prevState && currentState) {
        console.log('Downtime found, not sending alert yet');
        fs.writeFileSync(PREV_STATE_FILE_PATH, JSON.stringify(currentState));
        return;
    }
    if (prevState && currentState) {
        // ut oh.. :(
        if (!prevState.emailSent) {
            console.log('Downtime found, sending alert!');
            await sendAlertEmail();
            fs.writeFileSync(
                PREV_STATE_FILE_PATH,
                JSON.stringify({ ...prevState, emailSent: true })
            );
        } else {
            console.log('Downtime found, alert already sent');
        }
        return;
    }
    console.error('invalid state', { currentState, prevState });
    process.exit(1);
})();
