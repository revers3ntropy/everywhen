import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

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
