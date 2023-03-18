import { sveltekit } from '@sveltejs/kit/vite';
import * as fs from 'fs';
import type { UserConfig } from 'vite';

const __VERSION__ = JSON.stringify(
    JSON.parse(fs.readFileSync('./package.json', 'utf8'))
        .version,
);

const config: UserConfig = {
    plugins: [ sveltekit() ],
    define: {
        __VERSION__,
    },
};

export default config;
