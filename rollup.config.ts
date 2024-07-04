import replace from '@rollup/plugin-replace';
import { config as dotEnvConfig } from 'dotenv';

const env = process.env['ROLLUP_WATCH'] ? 'dev' : 'prod';

dotEnvConfig({ path: `./${env}.env` });

export default {
    plugins: [
        replace({
            values: {
                ENV: JSON.stringify({
                    env,
                    ...process.env
                })
            },
            preventAssignment: true
        })
    ]
};
