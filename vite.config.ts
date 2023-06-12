import { sveltekit } from '@sveltejs/kit/vite';
import * as fs from 'fs';
import type { UserConfig } from 'vite';

interface PackageJson {
    version: string;
}

const packageJson = JSON.parse(
    fs.readFileSync('./package.json', 'utf8')
) as PackageJson;

const __VERSION__ = JSON.stringify(packageJson.version);

const config: UserConfig = {
    plugins: [sveltekit()],
    define: {
        __VERSION__
    }
};

export default config;
