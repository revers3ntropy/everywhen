#!/usr/bin/env zx

import { $ } from 'zx';
import now from 'performance-now';
import c from 'chalk';
import commandLineArgs from 'command-line-args';
import * as dotenv from 'dotenv';
import prompts from 'prompts';
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
    [`./secrets/${env}/remote.env`]: '/.env',
    ['./server/server.js']: '/server.js',
    [`./server/remote.package.json`]: '/package.json',
    [`./node_modules/webp-converter/bin/libwebp_linux/bin/cwebp`]: `/server/bin/libwebp_linux/bin/cwebp`
};

$.verbose = verbose;

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

/**
 * @param {string} command
 * @returns {Promise<*>}
 */
async function runRemoteCommandSudo(command) {
    return await $`sshpass -f './secrets/${env}/sshpass.txt' ssh -t ${remoteSshAddress()} ${command}`;
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

/**
 * @param {Version} remoteVersion
 * @param {Version} localVersion
 * @returns {Promise<void>}
 */
async function doMigrations(remoteVersion, localVersion) {
    const start = performance.now();

    console.log('Checking for DB migrations...');

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

    const migrationsToRun = migrations.filter(migration =>
        migration.isGreaterThan(remoteVersion)
    );

    if (migrationsToRun.length === 0) {
        console.log(c.green('No migrations to run'));
        return;
    }

    const confirmedMigrations = [];

    console.log(c.cyan('Pending Database Migrations Found!'));
    for (const migration of migrationsToRun) {
        /**@type {{ value: boolean }} */
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
        const response = await prompts({
            type: 'confirm',
            name: 'value',
            message: `Run migration ${c.green(migration.str())}?`
        });

        if (response.value === true) {
            confirmedMigrations.push(migration);
        }
    }

    if (confirmedMigrations.length === 0) {
        console.log(c.green('No migrations to run'));
        return;
    }

    console.log('\n\n');
    for (const migration of confirmedMigrations) {
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
        return;
    }

    for (const migration of confirmedMigrations) {
        console.log(c.green(`Running migration '${migration.str()}'...`));
        await uploadPath(
            `./db/migrations/${migration.str()}.sql`,
            `~/${remoteDir()}/migration-to-run.sql`
        );
        await runRemoteCommandSudo(
            `cd ${remoteDir()} && mysql -u ${remoteEnv.DB_USER} -p"${
                remoteEnv.DB_PASS
            }" ${remoteEnv.DB} < migration-to-run.sql`
        );
        await runRemoteCommand(`rm ~/${remoteDir()}/migration-to-run.sql`);
        console.log(c.green(`Migration '${migration.str()}' complete!`));
    }

    console.log(c.green(`All migrations complete in ${now() - start}ms`));
}

/**
 * @returns {Promise<Version>}
 */
async function getRemoteVersion() {
    console.log(
        c.cyan(
            `Getting remote version from 'https://${remoteAddress()}/api/version'`
        )
    );
    const rawVersion = await fetch(`https://${remoteAddress()}/api/version`, {
        method: 'GET'
    });
    const apiVersion = await rawVersion.json();
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

async function main() {
    dotenv.config({ path: `./secrets/${env}/.env` });
    console.log(c.cyan(`Uploading to ${remoteSshAddress()} (${env})`));

    const remoteVersion = await getRemoteVersion();
    const localVersion = Version.fromPackageJson('./package.json');

    if (remoteVersion.isEqual(localVersion)) {
        console.log(c.red(`Remote version is equal to local version`));
        console.log(c.red(`${localVersion.str()} == ${remoteVersion.str()}`));
        throw new Error();
    }

    const start = now();

    await runRemoteCommand(`cd ${remoteDir()} && npm run stop`, false);

    // must do between stopping the server and deleting remote dir
    await doMigrations(remoteVersion, localVersion);

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

    await runRemoteCommand(`cd ${remoteDir()} && pnpm i`);

    console.log('Restarting remote server...');
    await runRemoteCommand(`cd ${remoteDir()} && npm run start`);

    const duration = (now() - start) / 1000;
    console.log(c.green(`Finished Uploading`));
    console.log(`Downtime: ${c.red(duration.toPrecision(3))}s`);
}

void main();
