import { config as dotEnvConfig } from 'dotenv';
import replace from '@rollup/plugin-replace';

const env = process.env.ROLLUP_WATCH ? 'dev' : 'prod';

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
