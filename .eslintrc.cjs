module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2021,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
        extraFileExtensions: ['.svelte'],
    },
    overrides: [
        {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            // Parse the `<script>` in `.svelte` as TypeScript by adding the following configuration.
            parserOptions: {
                parser: '@typescript-eslint/parser',
            },
        },
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:@typescript-eslint/eslint-recommended',
    ],
    plugins: [
        '@typescript-eslint',
    ],
    env: {
        es6: true,
        browser: true,
    },
    rules: {
        'no-constant-condition': 'off',
        // treats <script> tags as functions or something and complains
        // all functions are inner-ly declared
        'no-inner-declarations': 'off',
        // caught by other stuff and is too sensitive (e.g. `App`)
        'no-undef': 'off',
    },
};