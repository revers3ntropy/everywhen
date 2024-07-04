import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs['flat/recommended'],
    prettier,
    ...svelte.configs['flat/prettier'],
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        }
    },
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parserOptions: {
                parser: ts.parser
            }
        }
    },
    {
        ignores: ['build/', '.svelte-kit/', 'dist/', 'node_modules/']
    },
    {
        rules: {
            // https://github.com/typescript-eslint/typescript-eslint/issues/2621
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    vars: 'all',
                    caughtErrors: 'none',
                    varsIgnorePattern: '^_',
                    argsIgnorePattern: '^_'
                }
            ],
            //'prettier/prettier': 'error',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    disallowTypeAnnotations: false
                }
            ],
            // so I can do `while (true)`
            'no-constant-condition': 'off',
            // treats <script> tags as functions or something and complains
            // all functions are inner-ly declared
            'no-inner-declarations': 'off',
            // caught by other stuff and is too sensitive (e.g. `App`)
            'no-undef': 'off',
            // doesn't like namespaces for some reason
            // (see this: https://stackoverflow.com/questions/58270901)
            '@typescript-eslint/no-namespace': 'off',
            // just kinda useful sometimes
            '@typescript-eslint/no-empty-function': 'off',
            // required to inject markdown in entries
            'svelte/no-at-html-tags': 'off'
        }
    }
];
