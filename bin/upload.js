#!/usr/bin/env zx

import { $ } from 'zx';
import now from 'performance-now';
import c from 'chalk';
import commandLineArgs from 'command-line-args';
import * as dotenv from 'dotenv';
import fs from 'fs';

export const flags = commandLineArgs([
    { name: 'verbose', type: Boolean, alias: 'v', defaultValue: false },
    { name: 'env', type: String, alias: 'e', defaultValue: 'prod' },
    { name: 'restart', type: Boolean, alias: 'r', defaultValue: false }
]);

$.verbose = flags.verbose;

async function uploadPath(localPath, remotePath, args = '') {
    return await $`sshpass -f './secrets/${
        flags.env
    }/sshpass.txt' rsync ${args.split(' ')} ${localPath} ${
        process.env.REMOTE_ADDRESS
    }:${remotePath}`;
}

async function runRemoteCommand(command) {
    return await $`sshpass -f './secrets/${flags.env}/sshpass.txt' ssh ${process.env.REMOTE_ADDRESS} ${command}`;
}
async function runRemoteCommandSudo(command) {
    return await $`sshpass -f './secrets/${flags.env}/sshpass.txt' ssh -t ${process.env.REMOTE_ADDRESS} ${command}`;
}

const replacerValues = {
    '%ENV%': flags.env
};

const pathsToUseReplacer = [`./server/remote.package.json`];

const uploadPaths = {
    [`./secrets/${flags.env}/cert.pem`]: '/cert.pem',
    [`./secrets/${flags.env}/key.pem`]: '/key.pem',
    [`./secrets/${flags.env}/remote.env`]: '/.env',
    ['./server/server.js']: '/server.js',
    [`./server/remote.package.json`]: '/package.json',
    [`./node_modules/webp-converter/bin/libwebp_linux/bin/cwebp`]: `/server/bin/libwebp_linux/bin/cwebp`
};

async function upload() {
    await $`mv ./build ./${process.env.DIR}`;
    console.log(c.green('Uploading...'));
    await uploadPath(process.env.DIR, '~/', '-r');

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
                await uploadPath(
                    path,
                    '~/' + process.env.DIR + uploadPaths[path]
                );
            }
        })
    );

    for (const path of pathsToUseReplacer) {
        fs.unlinkSync(path);
        fs.renameSync(path + '.tmp', path);
    }

    await $`rm -r ./${process.env.DIR}`;
}

(async () => {
    const start = now();

    dotenv.config({ path: `./secrets/${flags.env}/.env` });

    console.log(`Uploading to ${process.env.REMOTE_ADDRESS} (${flags.env})`);

    await runRemoteCommand(`cd ${process.env.DIR} && npm run stop`);
    await runRemoteCommand(`rm -r ${process.env.DIR}`);

    // Required by 'webp-converter' package TODO: Remove this requirement
    await runRemoteCommand(
        `mkdir -p ${process.env.DIR}/server/bin/libwebp_linux/bin`
    );
    await runRemoteCommand(`mkdir -p ${process.env.DIR}/server/temp`);

    await upload();

    await runRemoteCommandSudo(
        `sudo chmod +x ${process.env.DIR}/server/bin/libwebp_linux/bin/cwebp`
    );

    await runRemoteCommand(`cd ${process.env.DIR} && npm i`);

    console.log('Restarting remote server...');
    await runRemoteCommand(`cd ${process.env.DIR} && npm run start`);

    const duration = (now() - start) / 1000;
    console.log(c.green(`Finished Uploading in ${duration.toFixed(3)}s`));
})();
