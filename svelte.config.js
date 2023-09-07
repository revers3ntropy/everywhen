import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/kit/vite';
import fs from 'fs';

/** @type {{ version: string }} */
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = packageJson.version;

const ignoreWarningCodes = ['css-unused-selector', 'unused-export-let'];

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),

    kit: {
        adapter: adapter(),
        inlineStyleThreshold: 250, // 250 characters
        prerender: {
            concurrency: 4
        }
    },

    compilerOptions: {
        preserveComments: false,
        preserveWhitespace: false,
        discloseVersion: true
    },

    /**
     * @param {{ code: string }} warning
     * @param {(c: { code: string }) => *} handler
     */
    onwarn: (warning, handler) => {
        const { code } = warning;

        if (ignoreWarningCodes.includes(code)) return;

        handler(warning);
    }
};

export default config;
