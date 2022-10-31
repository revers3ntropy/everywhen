import { parse } from 'cookie';
import { browser } from '$app/environment';
import { KEY_COOKIE_KEY, popup } from "./constants";
import type Component from "svelte/types/compiler/compile/Component";
import { bind } from "svelte-simple-modal";
import { api } from "./api/apiQuery";

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
	return '?' + Object.keys(args)
		.map((key) => `${key}=${args[key]}`)
		.join('&');
}

export function showPopup (el: Component, props: Record<string, any>, onClose: () => any) {
	const boundEl = bind(el, props);
	popup.set(boundEl);

	// not a very nice solution but I can't think of any other way
	// without creating a custom popup component which would just
	// be a pain
	const unsubscribe = popup.subscribe(async (value) => {
		if (value === boundEl) return;
		unsubscribe();

		onClose();
	});
}

export async function getFileContents (file: File, encoding = 'UTF-8'): Promise<string> {
	const reader = new FileReader();
	reader.readAsText(file, encoding);

	return await new Promise((resolve, reject) => {
		reader.onload = evt => {
			const res = evt.target?.result?.toString?.();
			if (!res && res !== '') {
				reject('Error reading file');
			}
			resolve(res || '');
		};
		reader.onerror = async () => {
			reject('Error reading file');
		};
	});
}