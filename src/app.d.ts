import '@total-typescript/ts-reset';
import type { COOKIE_KEYS } from '$lib/constants';
import type { SettingsConfig } from '$lib/controllers/settings/settings';
import type { Auth } from '$lib/controllers/auth/auth';

declare global {
    declare interface String {
        toLowerCase(): Lowercase<string>;
    }

    type RawCookies = { [K in keyof typeof COOKIE_KEYS]?: string };

    // See https://kit.svelte.dev/docs/types#app
    declare namespace App {
        interface PageData {
            __cookieWritables: RawCookies;
        }

        interface Locals {
            auth: Auth | null;
            settings: SettingsConfig | null;
            __cookieWritables: RawCookies;
        }

        // interface Error {}
        // interface Platform {}
    }

    // loaded in with Vite on build, got from package.json
    declare const __VERSION__: string;
}
