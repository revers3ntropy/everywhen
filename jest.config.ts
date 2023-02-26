import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    transform: {
        '^.+\\.svelte$': [
            'svelte-jester',
            { preprocess: './svelte.config.test.cjs' },
        ],
        '^.+\\.ts$': 'ts-jest',
        '^.+\\.js$': 'ts-jest',
    },
    moduleFileExtensions: [ 'js', 'ts', 'svelte' ],
    moduleNameMapper: {
        '^\\$lib(.*)$': '<rootDir>/src/lib$1',
        '^\\$app/environment$': '<rootDir>/src/jest-polyfill.ts',
        '^\\@sveltejs/kit': '<rootDir>/node_modules/@sveltejs/kit/src/exports/index.js',
        '^\\$app(.*)$': [
            '<rootDir>/.svelte-kit/dev/runtime/app$1',
            '<rootDir>/.svelte-kit/build/runtime/app$1',
        ],
    },
    setupFilesAfterEnv: [ '<rootDir>/jest-setup.ts' ],
    collectCoverageFrom: [ 'src/**/*.{ts,tsx,svelte,js,jsx}' ],
    extensionsToTreatAsEsm: [ '.ts' ],
    globals: {
        'ts-jest': {
            'useESM': true,
        },
    },
};

export default config;