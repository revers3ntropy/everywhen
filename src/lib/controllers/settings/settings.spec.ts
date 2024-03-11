import type { SettingTypeSpecifier } from '$lib/controllers/settings/settings';
import { Settings } from '$lib/controllers/settings/settings.server';
import { describe, expect, it } from 'vitest';
const v = Settings.validateSetting;

describe('wordCount', () => {
    function expectValid(type: SettingTypeSpecifier, value: unknown) {
        expect(v(type, value)).toBe(null);
    }
    function expectInvalid(type: SettingTypeSpecifier, value: unknown) {
        expect(typeof v(type, value)).toBe('string');
    }
    it('validates strings correctly', () => {
        expectValid('string', 'hi');
        expectValid('string', '');
        expectValid('string', ' '.repeat(1000));
        expectInvalid('string', null);
        expectInvalid('string', undefined);
        expectInvalid('string', 1);
        expectInvalid('string', []);
        expectInvalid('string', {});
        expectInvalid('string', true);
        expectInvalid('string', false);
        expectInvalid('string', new Date());
        expectInvalid('string', /a/);
        expectInvalid('string', Symbol());
        expectInvalid('string', () => {});
    });

    it('validates booleans correctly', () => {
        expectValid('boolean', true);
        expectValid('boolean', false);
        expectInvalid('boolean', null);
        expectInvalid('boolean', undefined);
        expectInvalid('boolean', 1);
        expectInvalid('boolean', []);
        expectInvalid('boolean', {});
        expectInvalid('boolean', '');
        expectInvalid('boolean', 'my string');
        expectInvalid('boolean', new Date());
        expectInvalid('boolean', /a/);
        expectInvalid('boolean', Symbol());
        expectInvalid('boolean', () => {});
    });

    it('validates numbers correctly', () => {
        expectValid('number', 1);
        expectValid('number', 0);
        expectValid('number', -1);
        expectValid('number', 1.1);
        expectValid('number', 0.1);
        expectValid('number', -1.1);
        expectInvalid('number', null);
        expectInvalid('number', undefined);
        expectInvalid('number', []);
        expectInvalid('number', {});
        expectInvalid('number', '');
        expectInvalid('number', 'my string');
        expectInvalid('number', true);
        expectInvalid('number', false);
        expectInvalid('number', new Date());
        expectInvalid('number', /a/);
        expectInvalid('number', Symbol());
        expectInvalid('number', () => {});
    });

    it('validates locations correctly', () => {
        expectValid('location', [1, 1]);
        expectValid('location', [0, 0]);
        expectValid('location', [0.1, 0.9]);
        expectValid('location', [null, null]);
        expectInvalid('location', null);
        expectInvalid('location', []);
        expectInvalid('location', [1, 'fish']);
        expectInvalid('location', [1, 2, 'fish']);
        expectInvalid('location', [1, 2, 3]);
        expectInvalid('location', [1]);
        expectInvalid('location', ['fish']);
        expectInvalid('location', [1, 2, 3, 4]);
        expectInvalid('location', [1, null]);
        expectInvalid('location', [null, 2]);
        expectInvalid('location', undefined);
        expectInvalid('location', {});
        expectInvalid('location', '');
        expectInvalid('location', 'my string');
        expectInvalid('location', true);
        expectInvalid('location', false);
        expectInvalid('location', new Date());
        expectInvalid('location', /a/);
        expectInvalid('location', Symbol());
        expectInvalid('location', () => {});
    });
});
