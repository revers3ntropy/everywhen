import * as fs from 'fs';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

const PACKAGE_JSON = JSON.parse(fs.readFileSync('./package.json', 'utf8')) as {
    version: string;
};

export default defineConfig({
    // TODO why does it complain about this type?
    plugins: [sveltekit() as unknown as null],
    define: {
        // doesn't like '"'s for some reason so use "'"s instead of JSON.stringify,
        // which is suggested here https://vitejs.dev/config/shared-options.html#define
        __VERSION__: `'${PACKAGE_JSON.version}'`
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@import '$lib/styles/variables';`
            }
        }
    },
    test: {
        include: ['./src/**/*.spec.ts']
    }
});
