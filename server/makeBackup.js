import { exec } from 'child_process';
import fs from 'fs';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const env = '%ENV%';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFileContent = fs.readFileSync(path.resolve(__dirname, `.env`), 'utf8');

/**
 * @type {{
 *     PUBLIC_INIT_VECTOR: string;
 *     PUBLIC_SVELTEKIT_PORT: string;
 *     DB_HOST: string;
 *     DB_PORT: string;
 *     DB_USER: string;
 *     DB_PASS: string;
 *     DB: string;
 *     PORT: string;
 *     HTTPS_PORT: string;
 *     BODY_SIZE_LIMIT: string;
 *  }}
 */
const envFile = dotenv.parse(envFileContent);

const backupsPath = `~/ew-backups/${env}`;
const backupsPathExpanded = path.join(process.env.HOME, backupsPath.slice(1));
const backupPath = `${backupsPath}/${Date.now()}.sql`;
const backupsToKeep = 7;

function clearOldBackups() {
    // expand '~'
    fs.readdirSync(backupsPathExpanded)
        .map(fileName => ({
            fileName,
            timestamp: parseInt(fileName.split('.')[0])
        }))
        // sort by timestamp (newest first)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(backupsToKeep)
        // remove old backups
        .forEach(({ fileName }) => fs.unlinkSync(`${backupsPathExpanded}/${fileName}`));
}

function createNewBackup() {
    return new Promise(resolve =>
        exec(
            `mysqldump --no-tablespaces -u "${envFile.DB_USER}" -p"${envFile.DB_PASS}" "${envFile.DB}" > ${backupPath}`,
            (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    return;
                }

                console.log(stdout);
                console.log(stderr);
                resolve();
            }
        )
    );
}

void (async () => {
    await createNewBackup().then(clearOldBackups);
})();
