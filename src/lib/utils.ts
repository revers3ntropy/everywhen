import { parse } from 'cookie';
import { browser } from '$app/environment';
import { KEY_COOKIE_KEY } from './constants';

export function getKey() {
	if (!browser) throw 'getKey() can only be used in the browser';
	return parse(document.cookie)[KEY_COOKIE_KEY];
}

const chars = '0123456789abcdefghijklmnopqrstuvwxyz ';
export function randomString(length: number, alphabet = chars): string {
	let result = '';
	for (let i = length; i > 0; --i) {
		result += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return result;
}

export function obfuscate(str: string, alphabet = chars): string {
	return str.replace(/./g, (char) => {
		if (char === '\n') return char;
		return alphabet[Math.floor(Math.random() * alphabet.length)];
	});
}

export function GETArgs(args: Record<string, string>): string {
	return Object.keys(args)
		.map((key) => `${key}=${args[key]}`)
		.join('&');
}
