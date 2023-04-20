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
]);

$.verbose = flags.verbose;

async function uploadPath (localPath, remotePath, args = '') {
    return await $`sshpass -f './secrets/${flags.env}/sshpass.txt' rsync ${args.split(
        ' ',
    )} ${localPath} ${process.env.REMOTE_ADDRESS}:${remotePath}`;
}

async function upload () {
    await $`mv ./build ./${process.env.DIR}`;
    console.log(c.green('Uploading...'));
    await uploadPath(process.env.DIR, '~/', '-r');

    const paths = {
        [`./secrets/${flags.env}/remote.package.json`]: '/package.json',
        [`./secrets/${flags.env}/cert.pem`]: '/cert.pem',
        [`./secrets/${flags.env}/key.pem`]: '/key.pem',
        [`./secrets/${flags.env}/remote.env`]: '/.env',
        ['./server/server.js']: '/server.js',
    };

    await Promise.all(
        Object.keys(paths).map(async (path) => {
            if (fs.existsSync(path)) {
                console.log(c.yellow(path));
                await uploadPath(
                    path,
                    '~/' + process.env.DIR + paths[path],
                );
            }
        }),
    );

    await $`rm -r ./${process.env.DIR}`;
}

(async () => {
    const start = now();

    dotenv.config({ path: `./secrets/${flags.env}/.env` });

    console.log(`Uploading to ${process.env.REMOTE_ADDRESS} (${flags.env})`);

    await upload();

    const duration = (now() - start) / 1000;
    console.log(c.green(`Finished Uploading in ${duration.toFixed(3)}s`));
})();
