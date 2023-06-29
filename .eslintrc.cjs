module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:svelte/recommended',
        'prettier'
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
        extraFileExtensions: ['.svelte']
    },
    env: {
        browser: true,
        es2017: true,
        node: true
    },
    overrides: [
        {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            parserOptions: {
                parser: '@typescript-eslint/parser'
            }
        }
    ],
    rules: {
        'no-constant-condition': 'off',
        // treats <script> tags as functions or something and complains
        // all functions are inner-ly declared
        'no-inner-declarations': 'off',
        // caught by other stuff and is too sensitive (e.g. `App`)
        'no-undef': 'off',
        // doesn't like namespaces for some reason
        // (see this: https://stackoverflow.com/questions/58270901)
        "@typescript-eslint/no-namespace": "off"
    },
};