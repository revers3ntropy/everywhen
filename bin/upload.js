#!/usr/bin/env zx

import { $ } from 'zx';
import now from 'performance-now';
import c from 'chalk';
import commandLineArgs from 'command-line-args';
import * as dotenv from 'dotenv';
import fs from 'fs';

const DIR = 'misc_3-server';

export const flags = commandLineArgs([
	{ name: 'verbose', type: Boolean, alias: 'v', defaultValue: false },
	{ name: 'env', type: String, alias: 'e', defaultValue: 'prod' }
]);

$.verbose = flags.verbose;

async function uploadPath(localPath, remotePath, args = '') {
	return await $`sshpass -f '${process.env.SSH_PASS_FILE}' rsync ${args.split(
		' '
	)} ${localPath} ${process.env.REMOTE_ADDRESS}:${remotePath}`;
}

async function upload() {
	await $`mv ./build ./${DIR}`;
	console.log(c.green('Uploading...'));
	await uploadPath(DIR, '~/', '-r');

	const paths = {
		[`./${flags.env}.remote.package.json`]: '/package.json',
		[`./${flags.env}.remote.env`]: '/.env',
		[`./Dockerfile`]: '/Dockerfile'
	};

	await Promise.all(
		Object.keys(paths).map(async (path) => {
			if (fs.existsSync(path)) {
				console.log(c.yellow(path));
				await uploadPath(path, '~/' + DIR + paths[path]);
			}
		})
	);

	await $`rm -r ./${DIR}`;
}

(async () => {
	const start = now();

	dotenv.config({ path: `./${flags.env}.env` });

	console.log(`Uploading to ${process.env.REMOTE_ADDRESS} (${flags.env})`);

	await upload();

	const duration = (now() - start) / 1000;
	console.log(c.green(`Finished Uploading in ${duration.toFixed(3)}s`));
})();
