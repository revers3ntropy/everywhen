#!/usr/bin/env zx

import { $ } from 'zx';
import now from 'performance-now';
import c from 'chalk';
import commandLineArgs from 'command-line-args';
import * as dotenv from 'dotenv';
import prompts from 'prompts';
import fs from 'fs';
import fetch from 'node-fetch';
import https from 'https';
import prompt from 'prompt-sync';

const noSslAgent = new https.Agent({
    rejectUnauthorized: false
});

/** @type {(options: *[]) => *} */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const cliArgs = commandLineArgs;

/** @type {{ verbose: boolean, env: string }} */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const { verbose, env } = cliArgs([
    { name: 'verbose', type: Boolean, alias: 'v', defaultValue: false },
    { name: 'env', type: String, alias: 'e', defaultValue: 'prod' }
]);

const remoteEnvFile = fs.readFileSync(`./secrets/${env}/remote.env`, 'utf8');
/**
 * @type {{
 *   PUBLIC_INIT_VECTOR: string,
 *   PUBLIC_SVELTEKIT_PORT: string,
 *   DB_HOST: string,
 *   DB_PORT: string,
 *   DB_USER: string,
 *   DB_PASS: string,
 *   DB: string,
 *   PORT: string,
 *   HTTPS_PORT: string,
 *   BODY_SIZE_LIMIT: string,
 * }}
 */
const remoteEnv = dotenv.parse(remoteEnvFile);

/** @type {Record<string, string>} */
const replacerValues = {
    '%ENV%': env
};

const pathsToUseReplacer = [`./server/remote.package.json`];

const uploadPaths = {
    [`./secrets/${env}/cert.pem`]: '/cert.pem',
    [`./secrets/${env}/key.pem`]: '/key.pem',
    [`./secrets/${env}/ca.pem`]: '/ca.pem',
    [`./secrets/${env}/remote.env`]: '/.env',
    ['./server/server.js']: '/server.js',
    [`./server/remote.package.json`]: '/package.json',
    [`./node_modules/webp-converter/bin/libwebp_linux/bin/cwebp`]: `/server/bin/libwebp_linux/bin/cwebp`
};

const LOG_PREFIX = c.blueBright('[deploy.js]');

const consoleLog = console.log;
const consoleError = console.error;
const consoleWarn = console.warn;
console.log = (...args) => {
    if (verbose) {
        consoleLog(LOG_PREFIX, ...args);
    }
};
console.warn = (...args) => {
    consoleWarn(LOG_PREFIX, ...args);
};
console.error = (...args) => {
    consoleError(LOG_PREFIX, ...args);
};

$.verbose = verbose;

/**
 * @param {number} ms
 * @returns {Promise<unknown>}
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Version {
    major = 0;
    minor = 0;
    patch = 0;

    /**
     * @param {string} version
     * @returns {Version}
     */
    static fromString(version) {
        const v = new Version();
        const parts = version.split('.');
        if (parts.length !== 3) {
            console.error(c.red('Invalid SemVer string: ' + version));
            throw new Error();
        }
        v.major = parseInt(parts[0]);
        v.minor = parseInt(parts[1]);
        v.patch = parseInt(parts[2]);
        return v;
    }

    /**
     * @param {Version | string} version
     * @returns {boolean}
     */
    isGreaterThan(version) {
        if (typeof version === 'string') {
            version = Version.fromString(version);
        }
        if (this.major > version.major) {
            return true;
        }
        if (this.major === version.major) {
            if (this.minor > version.minor) {
                return true;
            }
            if (this.minor === version.minor) {
                return this.patch > version.patch;
            }
        }
        return false;
    }

    /**
     * @param {Version | string} version
     * @returns {boolean}
     */
    isEqual(version) {
        if (typeof version === 'string') {
            version = Version.fromString(version);
        }
        return (
            this.major === version.major &&
            this.minor === version.minor &&
            this.patch === version.patch
        );
    }

    /**
     * @returns {string}
     */
    str() {
        return `${this.major}.${this.minor}.${this.patch}`;
    }

    /**
     * @param {string} path
     * @returns {Version}
     */
    static fromPackageJson(path) {
        const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
        if (typeof pkg !== 'object' || pkg === null) {
            throw new Error('package.json is not an object');
        }
        if (!('version' in pkg)) {
            throw new Error(`'version' not found in '${path}'`);
        }
        const version = pkg.version;
        if (typeof version !== 'string') {
            throw new Error('version is not a string');
        }
        return Version.fromString(version);
    }
}

function remoteAddress() {
    const addr = process.env.REMOTE_ADDRESS;
    if (!addr) throw new Error('REMOTE_ADDRESS not set');
    return addr;
}

/**
 * @returns {string}
 */
function remoteSshAddress() {
    const addr = remoteAddress();
    const usr = process.env.REMOTE_USER;
    if (!usr) throw new Error('REMOTE_USER not set');
    return `${usr}@${addr}`;
}

/**
 * @returns {string}
 */
function remoteDir() {
    const dir = process.env.DIR;
    if (!dir) throw new Error('DIR not set');
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
    )} ${localPath} ${remoteSshAddress()}:${remotePath}`;
}

/**
 * @param {string} command
 * @param {boolean} failOnError
 * @returns {Promise<*>}
 */
async function runRemoteCommand(command, failOnError = true) {
    return await $`sshpass -f './secrets/${env}/sshpass.txt' ssh ${remoteSshAddress()} ${command}`.catch(
        err => {
            if (failOnError) {
                throw err;
            }
            console.error(err);
        }
    );
}

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
                await uploadPath(path, '~/' + remoteDir() + uploadPaths[path]);
            } else {
                console.warn(c.yellow(`File not found: ${path}`));
            }
        })
    );

    for (const path of pathsToUseReplacer) {
        fs.unlinkSync(path);
        fs.renameSync(path + '.tmp', path);
    }

    await $`rm -r ./${remoteDir()}`;
}

/**
 * @param {Version[]} migrations
 * @returns {Promise<void>}
 */
async function doMigrations(migrations) {
    const start = now();

    for (const migration of migrations.map(m => m.str())) {
        console.log(c.green(`Running migration '${migration}'...`));
        const migrationFile = `~/migration-${migration}.sql`;
        await uploadPath(`./db/migrations/${migration}.sql`, migrationFile);
        await runRemoteCommand(
            `mysql -u ${remoteEnv.DB_USER} -p"${remoteEnv.DB_PASS}" ${remoteEnv.DB} < ${migrationFile}`
        );
        await runRemoteCommand(`rm ${migrationFile}`);
        console.log(c.green(`Migration '${migration}' complete!`));
    }

    const time = (now() - start).toPrecision(3);
    console.log(c.green(`${migrations.length} migrations complete in ${time}ms`));
}

/**
 * @param {Version} remoteVersion
 * @param {Version} localVersion
 * @returns {Promise<Version[]>}
 */
async function getMigrations(remoteVersion, localVersion) {
    const migrations = fs
        .readdirSync('./db/migrations')
        .map(file => Version.fromString(file.replace('.sql', '')));

    for (const migration of migrations) {
        if (migration.isGreaterThan(localVersion)) {
            console.error(c.red(`Migration above local version!`));
            console.error(c.red(`${migration.str()} > ${localVersion.str()}`));
            throw new Error('');
        }
    }

    const migrationsToRun = migrations.filter(migration => migration.isGreaterThan(remoteVersion));

    if (migrationsToRun.length === 0) {
        console.log(c.green('No migrations found'));
        return [];
    }

    console.log(c.cyan('Pending database migrations found!'));

    if (migrationsToRun.length === 0) {
        console.log(c.green('No confirmed migrations found'));
        return [];
    }

    console.log('Confirm migrations to run:');
    for (const migration of migrationsToRun) {
        console.log(`    ${c.green(migration.str())}`);
    }

    /**@type {{ value: boolean }} */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    const response = await prompts({
        type: 'confirm',
        name: 'value',
        message: `Run these migrations?`
    });

    if (response.value !== true) {
        console.log(c.red('Aborting...'));
        throw new Error();
    }

    return migrationsToRun;
}

/**
 * @returns {Promise<Version | null>}
 */
async function getRemoteVersion() {
    console.log(`Getting remote version from '${remoteAddress()}/api/version'...`);
    const rawVersion = await fetch(`https://${remoteAddress()}/api/version`, {
        agent: noSslAgent
    });

    let apiVersion;
    try {
        apiVersion = await rawVersion.json();
    } catch (e) {
        return null;
    }
    if (typeof apiVersion !== 'object' || apiVersion === null) {
        console.error(apiVersion);
        throw new Error('Invalid version response');
    }
    if (!('v' in apiVersion)) {
        console.error(apiVersion);
        throw new Error('Invalid version response');
    }
    if (typeof apiVersion.v !== 'string') {
        console.error(apiVersion);
        throw new Error('Invalid version response');
    }
    return Version.fromString(apiVersion.v);
}

/**
 * @param {Version} localVersion
 */
async function restartServer(localVersion) {
    await runRemoteCommand(`cd ~/${remoteDir()} && npm run setup`);

    while (true) {
        console.log('Restarting remote server...');
        await runRemoteCommand(`cd ~/${remoteDir()} && npm run start`);

        await sleep(1000);

        try {
            const remoteVersion = await getRemoteVersion().catch(console.error);
            if (remoteVersion && remoteVersion.isEqual(localVersion)) {
                console.log(c.green(`Complete: v${localVersion.str()} is live on ${env}`));
                return;
            }
        } catch (e) {
            console.error(e);
        }
        console.log(c.red('Server restart seemed to fail...'));

        /**@type {{ value: boolean }} */
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
        const response = await prompts({
            type: 'confirm',
            name: 'value',
            message: `Retry?`
        });

        if (response.value !== true) {
            return;
        }
    }
}

/**
 * @returns {Promise<{localVersion: Version, remoteVersion: Version}>}
 */
async function getAndCheckVersions() {
    dotenv.config({ path: `./secrets/${env}/.env` });
    console.log(c.cyan(`Deploying to ${remoteSshAddress()} (${env})`));

    let remoteVersion = await getRemoteVersion();
    if (remoteVersion === null) {
        console.log(c.red('Failed to get remote version'));
        remoteVersion = Version.fromString(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call
            prompt({ sigint: true })('Enter remote version: ')
        );
    }

    const localVersion = Version.fromPackageJson('./package.json');

    console.log(`Found remote version: ${c.yellow(remoteVersion.str())}`);
    console.log(`Found local version: ${c.yellow(localVersion.str())}`);

    if (remoteVersion.isEqual(localVersion) || remoteVersion.isGreaterThan(localVersion)) {
        console.log(c.red(`Remote version is equal to (or gt) local version`));
        console.log(c.red(`${localVersion.str()} <= ${remoteVersion.str()}`));
        throw new Error();
    }

    return { remoteVersion, localVersion };
}

async function preCommit() {
    await $`bin/precommit --reporter=line`;
}

/**
 * @returns {Promise<void>}
 */
async function build() {
    await $`mv .env tmp.env`;
    await $`mv ./secrets/${env}/remote.env .env`;

    await $`bin/build`;

    await $`mv .env ./secrets/${env}/remote.env`;
    await $`mv tmp.env .env`;

    if (!fs.existsSync('./build')) {
        console.error('Build failed: no build directory');
        throw new Error();
    }
}

async function tearDownRemote() {
    console.log(c.yellow(`Tearing down remote server...`));
    await runRemoteCommand(`cd ~/${remoteDir()} && npm run stop`, false);
    await runRemoteCommand(`rm -rf ~/${remoteDir()}`, false);
}

async function setupLibWebP() {
    // Required by 'webp-converter' package TODO: Remove this requirement
    await runRemoteCommand(`mkdir -p ~/${remoteDir()}/server/bin/libwebp_linux/bin`);
    await runRemoteCommand(`mkdir -p ~/${remoteDir()}/server/temp`);
}

async function main() {
    const start = now();

    const { remoteVersion, localVersion } = await getAndCheckVersions();

    const migrations = await getMigrations(remoteVersion, localVersion);

    await preCommit();
    await build();

    const serverDownStart = now();
    await tearDownRemote();
    // must do between stopping the server and deleting remote dir
    await doMigrations(migrations);

    await setupLibWebP();

    await upload();

    await restartServer(localVersion);

    const downtime = (now() - serverDownStart) / 1000;
    console.log(`Estimated downtime: ${c.red(downtime.toPrecision(3))}s`);
    const totalTime = (now() - start) / 1000;
    console.log(`Total time: ${c.cyan(totalTime.toPrecision(3))}s`);
}

void main();
