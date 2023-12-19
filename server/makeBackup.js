import { exec } from 'child_process';
import fs from 'fs';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const env = '$ENV$';

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

const backupPath = `~/ew-backups/${env}/${Date.now()}.sql`;

exec(
    `mysqldump --no-tablespaces -u "${envFile.DB_USER}" -p"${envFile.DB_PASS}" "${envFile.DB}" > ${backupPath}`,
    (err, stdout, stderr) => {
        if (err) {
            console.log(err);
            return;
        }

        console.log(stdout);
        console.log(stderr);
    }
);
