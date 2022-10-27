// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	interface Locals {
		userid: string;
	}

	// interface PageData {}

	// interface Platform {}
}

declare module '$env/static/private' {
	export const DB_HOST: string;
	export const DB_USER: string;
	export const DB_PASS: string;
	export const DB: string;
	export const DB_PORT: string;
	export const KEY_HASH: string;
	export const INIT_VECTOR: string;
	export const PUBLIC_SVELTEKIT_PORT: string;
}

interface String {
	padStart(targetLength: number, padString: string): string;
	padEnd(targetLength: number, padString: string): string;
}