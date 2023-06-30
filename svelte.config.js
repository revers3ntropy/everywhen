import adapter from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';

const ignoreWarningCodes = ['css-unused-selector', 'unused-export-let'];

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://github.com/sveltejs/svelte-preprocess
    // for more information about preprocessors
    preprocess: preprocess(),

    kit: {
        adapter: adapter()
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
