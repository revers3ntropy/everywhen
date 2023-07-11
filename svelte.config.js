import adapter from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';
import fs from 'fs';

/** @type {{ version: string }} */
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = packageJson.version;

const ignoreWarningCodes = ['css-unused-selector', 'unused-export-let'];

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://github.com/sveltejs/svelte-preprocess
    // for more information about preprocessors
    preprocess: preprocess(),

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
