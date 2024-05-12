import { defineConfig, devices } from '@playwright/test';

// Read environment variables from file.
// https://github.com/motdotla/dotenv
// require('dotenv').config();

// See https://playwright.dev/docs/test-configuration.
export default defineConfig({
    testDir: './e2e',
    // Maximum time (ms) one test can run for.
    timeout: 10 * 1000,
    expect: {
        // Maximum time expect() should wait for the condition to be met.
        // For example in `await expect(locator).toHaveText();`
        timeout: 1000
    },
    fullyParallel: false,
    // expect.only(...
    forbidOnly: !!process.env['CI'],
    retries: 1,
    workers: process.env['CI'] ? 1 : undefined,
    reporter: 'html',
    use: {
        actionTimeout: 0,
        baseURL: 'http://localhost:5173',

        trace: 'on-first-retry',

        headless: true
    },

    projects: [
        // {
        //     name: 'chromium',
        //     use: { ...devices['Desktop Chrome'] },
        // },
        // {
        //     name: 'firefox',
        //     use: { ...devices['Desktop Firefox'] },
        // },

        // Test against branded browsers.
        // {
        //     name: 'Microsoft Edge',
        //     use: { channel: 'msedge' }
        // },
        {
            name: 'Google Chrome',
            use: { channel: 'chrome' }
        },
        // Test against mobile viewports.
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] }
        }

        // Doesn't work on Ubuntu :/
        // {
        //     name: 'webkit',
        //     use: { ...devices['Desktop Safari'] },
        // },
        // Also doesn't work on Ubuntu :/
        // {
        //     name: 'Mobile Safari',
        //     use: { ...devices['iPhone 12'] },
        // },
    ],

    // Folder for test artifacts such as screenshots, videos, traces, etc.
    outputDir: 'test-results/',

    // Run your local dev server before starting the tests
    webServer: {
        command: 'vite preview --port 5173',
        port: 5173,
        reuseExistingServer: false
    }
});
