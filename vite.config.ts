import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import * as fs from 'fs';

interface PackageJson {
    version: string;
}

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8')) as PackageJson;

const __VERSION__ = JSON.stringify(packageJson.version);

export default defineConfig({
    plugins: [sveltekit()],
    define: {
        __VERSION__
    },
    test: {
        include: ['src/**/*.spec.ts']
    }
});
