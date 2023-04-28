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

const replacerValues = {
    '%ENV%': flags.env
};

const pathsToUseReplacer = [`./server/remote.package.json`];

const uploadPaths = {
    [`./secrets/${flags.env}/cert.pem`]: '/cert.pem',
    [`./secrets/${flags.env}/key.pem`]: '/key.pem',
    [`./secrets/${flags.env}/remote.env`]: '/.env',
    ['./server/server.js']: '/server.js',
    [`./server/remote.package.json`]: '/package.json'
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

async function restartRemoteServer() {
    console.log('Restarting remote server...');
    return await $`sshpass -f './secrets/${flags.env}/sshpass.txt' ssh ${process.env.REMOTE_ADDRESS} 'cd ${process.env.DIR} && npm run restart'`;
}

(async () => {
    const start = now();

    dotenv.config({ path: `./secrets/${flags.env}/.env` });

    console.log(`Uploading to ${process.env.REMOTE_ADDRESS} (${flags.env})`);

    await upload();

    console.log(flags.restart);
    if (flags.restart) {
        await restartRemoteServer();
    }

    const duration = (now() - start) / 1000;
    console.log(c.green(`Finished Uploading in ${duration.toFixed(3)}s`));
})();
