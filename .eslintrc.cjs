module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:@typescript-eslint/eslint-recommended',
        'prettier'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2021,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: [
            './tsconfig.json',
            './tsconfig.eslint.json'
        ],
        extraFileExtensions: ['.svelte'],
    },
    overrides: [
        {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            parserOptions: {
                parser: '@typescript-eslint/parser',
            },
        },
    ],
    plugins: [
        '@typescript-eslint',
        'prettier'
    ],
    env: {
        es6: true,
        browser: true,
        node: true
    },
    rules: {
        'prettier/prettier': 'error',
        '@typescript-eslint/strict-boolean-expressions': ['off', {
            allowString: false,
            allowNumber: false,
            allowNullableObject: true,
            allowNullableBoolean: true,
            allowNullableString: false,
            allowNullableNumber: false,
        }],
        // so I can do `while (true)`
        'no-constant-condition': 'off',
        // treats <script> tags as functions or something and complains
        // all functions are inner-ly declared
        'no-inner-declarations': 'off',
        // caught by other stuff and is too sensitive (e.g. `App`)
        'no-undef': 'off',
        // doesn't like namespaces for some reason
        // (see this: https://stackoverflow.com/questions/58270901)
        "@typescript-eslint/no-namespace": "off",
        // just kinda useful sometimes
        "@typescript-eslint/no-empty-function": "off",
    },
};