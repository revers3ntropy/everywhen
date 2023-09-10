import { $ } from 'zx';
import now from 'performance-now';
import c from 'chalk';
import commandLineArgs from 'command-line-args';
import * as dotenv from 'dotenv';
import prompts from 'prompts';
import fs from 'fs';
import fetch from 'node-fetch';
import prompt from 'prompt-sync';

const cliArgs = commandLineArgs;

export const { verbose, env } = cliArgs([
    { name: 'verbose', type: Boolean, alias: 'v', defaultValue: false },
    { name: 'env', type: String, alias: 'e', defaultValue: 'prod' }
]) as { verbose: boolean; env: string };

const remoteEnvFile = fs.readFileSync(`./secrets/${env}/remote.env`, 'utf8');

const remoteEnv = dotenv.parse<{
    PUBLIC_INIT_VECTOR: string;
    PUBLIC_SVELTEKIT_PORT: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_USER: string;
    DB_PASS: string;
    DB: string;
    PORT: string;
    HTTPS_PORT: string;
    BODY_SIZE_LIMIT: string;
}>(remoteEnvFile);

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
    [`./server/remote.package.json`]: '/package.json'
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

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function utcSeconds() {
    return Math.floor(Date.now() / 1000);
}

class Version {
    major = 0;
    minor = 0;
    patch = 0;

    static fromString(version: string): Version {
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

    isGreaterThan(version: Version): boolean {
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

    isEqual(version: Version): boolean {
        if (typeof version === 'string') {
            version = Version.fromString(version);
        }
        return (
            this.major === version.major &&
            this.minor === version.minor &&
            this.patch === version.patch
        );
    }

    str(): string {
        return `${this.major}.${this.minor}.${this.patch}`;
    }

    static fromPackageJson(path: string): Version {
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
    const addr = process.env['REMOTE_ADDRESS'];
    if (!addr) throw new Error('REMOTE_ADDRESS not set');
    return addr;
}

function remoteSshAddress(): string {
    const addr = remoteAddress();
    const usr = process.env['REMOTE_USER'];
    if (!usr) throw new Error('REMOTE_USER not set');
    return `${usr}@${addr}`;
}

function remoteDir() {
    const dir = process.env['DIR'];
    if (!dir) throw new Error('DIR not set');
    return dir;
}

function uploadPath(localPath: string, remotePath: string, args = ''): Promise<unknown> {
    return $`sshpass -f './secrets/${env}/sshpass.txt' rsync ${args.split(
        ' '
    )} ${localPath} ${remoteSshAddress()}:${remotePath}`;
}

async function runRemoteCommand(
    command: string,
    { failOnError = true, hideLogs = false }: { failOnError?: boolean; hideLogs?: boolean } = {}
): Promise<unknown> {
    const wasVerbose = $.verbose;
    if (hideLogs) $.verbose = false;

    let result;
    try {
        result =
            await $`sshpass -f './secrets/${env}/sshpass.txt' ssh ${remoteSshAddress()} ${command}`;
    } catch (err) {
        if (failOnError) throw err;
        console.error(err);
    }

    $.verbose = wasVerbose;
    return result;
}

async function upload() {
    await $`mv ./build ./${process.env['DIR']}`;
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
                    matched => replacerValues[matched as keyof typeof replacerValues]
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

async function doMigrations(migrations: Version[]): Promise<void> {
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

async function getMigrations(remoteVersion: Version, localVersion: Version): Promise<Version[]> {
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

async function getRemoteVersion(): Promise<Version | null> {
    console.log(`Getting remote version from '${remoteAddress()}/api/version'...`);
    const rawVersion = await fetch(`https://${remoteAddress()}/api/version`);

    if (!rawVersion.ok) return null;

    let apiVersion: { v: string };
    try {
        apiVersion = (await rawVersion.json()) as { v: string };
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

async function restartServer(localVersion: Version): Promise<void> {
    async function checkServerUp(): Promise<boolean> {
        await sleep(500);

        try {
            const remoteVersion = await getRemoteVersion().catch(console.error);
            if (remoteVersion?.isEqual(localVersion)) {
                console.log(c.green(`Complete: v${localVersion.str()} is live on ${env}`));
                return true;
            } else {
                console.log(
                    c.red(`Hmm, ${remoteVersion?.str?.() || 'null'} !== ${localVersion.str()}`)
                );
            }
        } catch (e) {
            console.error(e);
        }
        return false;
    }

    await runRemoteCommand(`cd ~/${remoteDir()} && npm run setup`);

    while (true) {
        console.log('Restarting remote server...');
        await runRemoteCommand(`cd ~/${remoteDir()} && npm run start`);

        for (let _ = 0; _ < 6; _++) {
            if (await checkServerUp()) return;
        }

        console.log(c.red('Server restart seemed to fail...'));

        const response = await prompts({
            type: 'confirm',
            name: 'value',
            message: `Retry?`
        });

        if (response.value !== true) return;
    }
}

async function getAndCheckVersions(): Promise<{ localVersion: Version; remoteVersion: Version }> {
    dotenv.config({ path: `./secrets/${env}/.env` });
    console.log(c.cyan(`Deploying to ${remoteSshAddress()} (${env})`));

    let remoteVersion = await getRemoteVersion();
    if (remoteVersion === null) {
        console.log(c.red('Failed to get remote version'));
        remoteVersion = Version.fromString(prompt({ sigint: true })('Enter remote version: '));
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

async function checkAndTest() {
    await $`bin/precommit --reporter=line`;
}

async function build() {
    await $`cp .env tmp.env`;
    await $`cp ./secrets/${env}/remote.env .env`;

    async function cleanup() {
        await $`cp tmp.env .env`;
        await $`rm tmp.env`;
    }

    try {
        await $`bin/build`;
    } catch (e) {
        await cleanup();
        throw e;
    }

    await cleanup();

    if (!fs.existsSync('./build')) {
        console.error('Build failed: no build directory');
        throw new Error();
    }
}

async function backupDatabase(localVersion: Version): Promise<void> {
    console.log(c.yellow(`Backing up database...`));
    // not under remoteDir because it gets deleted on every deploy
    const backupFile = `~/hl-${env}-${localVersion.str()}-${utcSeconds()}.sql`;
    await runRemoteCommand(
        `mysqldump -u ${remoteEnv.DB_USER} -p"${remoteEnv.DB_PASS}" ${remoteEnv.DB} > ${backupFile}`,
        { hideLogs: true }
    );
    console.log(c.green(`Database backed up to '${backupFile}'`));
}

async function tearDownRemote() {
    console.log(c.yellow(`Tearing down remote server...`));
    await runRemoteCommand(`cd ~/${remoteDir()} && npm run stop`, { failOnError: false });
    await runRemoteCommand(`rm -rf ~/${remoteDir()}`, { failOnError: false });
}

async function standardDeploy() {
    const { remoteVersion, localVersion } = await getAndCheckVersions();

    const migrations = await getMigrations(remoteVersion, localVersion);

    await checkAndTest();

    await build();

    const serverDownStart = now();

    await tearDownRemote();

    await backupDatabase(localVersion);

    // must do between stopping the server and deleting remote dir
    await doMigrations(migrations);

    await upload();

    await restartServer(localVersion);

    const downtime = (now() - serverDownStart) / 1000;
    console.log(`Estimated downtime: ${c.red(downtime.toPrecision(3))}s`);
}

async function awsDeploy() {
    await $`bin/build`;
    console.error('AWS deployment not implemented');
}

async function main() {
    const start = now();

    switch (env) {
        case 'aws':
            await awsDeploy();
            break;
        case 'staging':
        case 'prod':
            await standardDeploy();
            break;
        default:
            console.error('Invalid env: ' + env);
            break;
    }

    const totalTime = (now() - start) / 1000;
    console.log(`Total time: ${c.cyan(totalTime.toPrecision(3))}s`);
}

void main();
