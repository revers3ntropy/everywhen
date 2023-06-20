#!/usr/bin/env zx

import { $ } from 'zx';
import now from 'performance-now';
import c from 'chalk';
import commandLineArgs from 'command-line-args';
import * as dotenv from 'dotenv';
import fs from 'fs';

/**
 * @type {(options: *[]) => *}
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const cliArgs = commandLineArgs;

/**
 * @type {{ verbose: boolean, env: string }}
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const { verbose, env } = cliArgs([
    { name: 'verbose', type: Boolean, alias: 'v', defaultValue: false },
    { name: 'env', type: String, alias: 'e', defaultValue: 'prod' }
]);

$.verbose = verbose;

/**
 * @returns {string}
 */
function remoteAddress() {
    const addr = process.env.REMOTE_ADDRESS;
    if (!addr) {
        throw new Error('REMOTE_ADDRESS not set');
    }
    return addr;
}

/**
 * @returns {string}
 */
function remoteDir() {
    const dir = process.env.DIR;
    if (!dir) {
        throw new Error('DIR not set');
    }
    return dir;
}

/**
 * @param {string} localPath
 * @param {string} remotePath
 * @param args
 * @returns {Promise<*>}
 */
async function uploadPath(localPath, remotePath, args = '') {
    return await $`sshpass -f './secrets/${env}/sshpass.txt' rsync ${args.split(
        ' '
    )} ${localPath} ${remoteAddress()}:${remotePath}`;
}

/**
 * @param {string} command
 * @param {boolean} failOnError
 * @returns {Promise<*>}
 */
async function runRemoteCommand(command, failOnError = true) {
    return await $`sshpass -f './secrets/${env}/sshpass.txt' ssh ${remoteAddress()} ${command}`.catch(
        err => {
            if (failOnError) {
                throw err;
            }
            console.error(err);
        }
    );
}

/**
 * @param {string} command
 * @returns {Promise<*>}
 */
async function runRemoteCommandSudo(command) {
    return await $`sshpass -f './secrets/${env}/sshpass.txt' ssh -t ${remoteAddress()} ${command}`;
}

/**
 * @type {Record<string, string>}
 */
const replacerValues = {
    '%ENV%': env
};

const pathsToUseReplacer = [`./server/remote.package.json`];

const uploadPaths = {
    [`./secrets/${env}/cert.pem`]: '/cert.pem',
    [`./secrets/${env}/key.pem`]: '/key.pem',
    [`./secrets/${env}/remote.env`]: '/.env',
    ['./server/server.js']: '/server.js',
    [`./server/remote.package.json`]: '/package.json',
    [`./node_modules/webp-converter/bin/libwebp_linux/bin/cwebp`]: `/server/bin/libwebp_linux/bin/cwebp`
};

async function upload() {
    await $`mv ./build ./${process.env.DIR}`;
    console.log(c.green('Uploading...'));
    await uploadPath(remoteDir(), '~/', '-r');

    for (const path of pathsToUseReplacer) {
        fs.copyFileSync(path, path + '.tmp');
        fs.writeFileSync(
            path,
            fs
                .readFileSync(path + '.tmp', 'utf8')
                .replace(
                    new RegExp(Object.keys(replacerValues).join('|'), 'gi'),
                    matched => replacerValues[matched]
                )
        );
    }

    await Promise.all(
        Object.keys(uploadPaths).map(async path => {
            if (fs.existsSync(path)) {
                console.log(c.yellow(path));
                await uploadPath(path, '~/' + remoteDir() + uploadPaths[path]);
            }
        })
    );

    for (const path of pathsToUseReplacer) {
        fs.unlinkSync(path);
        fs.renameSync(path + '.tmp', path);
    }

    await $`rm -r ./${remoteDir()}`;
}

async function main() {
    dotenv.config({ path: `./secrets/${env}/.env` });
    console.log(`Uploading to ${remoteAddress()} (${env})`);

    const start = now();

    await runRemoteCommand(`cd ${remoteDir()} && npm run stop`, false);
    await runRemoteCommand(`rm -r ${remoteDir()}`, false);

    // Required by 'webp-converter' package TODO: Remove this requirement
    await runRemoteCommand(
        `mkdir -p ${remoteDir()}/server/bin/libwebp_linux/bin`
    );
    await runRemoteCommand(`mkdir -p ${remoteDir()}/server/temp`);

    await upload();

    await runRemoteCommandSudo(
        `sudo chmod +x ${remoteDir()}/server/bin/libwebp_linux/bin/cwebp`
    );

    await runRemoteCommand(`cd ${remoteDir()} && npm i`);

    console.log('Restarting remote server...');
    await runRemoteCommand(`cd ${remoteDir()} && npm run start`);

    const duration = (now() - start) / 1000;
    console.log(c.green(`Finished Uploading`));
    console.log(`Downtime: ${c.red(duration.toPrecision(3))}s`);
}

void main();
