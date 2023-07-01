import type { SettingConfig, Settings as _Settings, SettingValue } from './settings';
export type Settings<T = unknown> = _Settings<T>;

export const settingsConfig = {
    hideEntriesByDefault: {
        type: 'boolean',
        defaultValue: false,
        name: 'Blur Entries By Default',
        description: 'Blur entries by default, and manually show them.',
        showInSettings: true
    } as SettingConfig<boolean>,
    entryFormMode: {
        type: 'boolean',
        defaultValue: false,
        name: 'Use Bullet Mode',
        description: 'Write entries in Bullet Journaling mode.',
        showInSettings: false
    } as SettingConfig<boolean>,
    showAgentWidgetOnEntries: {
        type: 'boolean',
        defaultValue: false,
        name: 'Show Device',
        description: 'Shows the operating system of the device the entry was submitted on.',
        showInSettings: true
    } as SettingConfig<boolean>,
    autoHideEntriesDelay: {
        type: 'number',
        defaultValue: 0,
        name: 'Auto Blur Entries After',
        description:
            `Blur entries after 'N' seconds without user interaction. ` + `Set to 0 to disable.`,
        showInSettings: true,
        unit: 'seconds'
    } as SettingConfig<Seconds>,
    passcode: {
        type: 'string',
        defaultValue: '',
        name: 'Passcode',
        description: `Passcode to access the app. Leave blank to disable.`,
        showInSettings: true
    } as SettingConfig<string>,
    passcodeTimeout: {
        type: 'number',
        defaultValue: 0,
        name: 'Passcode Timeout',
        description:
            `Delay before passcode is required again. ` +
            `Set to 0 to only require once per device.`,
        showInSettings: true,
        unit: 'seconds'
    } as SettingConfig<Seconds>,
    yearOfBirth: {
        type: 'number',
        defaultValue: 2000,
        name: 'Year of Birth',
        description: `The first year in which you lived. Used by the timeline.`,
        showInSettings: true
    } as SettingConfig<number>,
    showNYearsAgoEntryTitles: {
        type: 'boolean',
        defaultValue: true,
        name: 'Show "On this Day" Entries',
        description: `Show entries which happened on this day some number of years ago on the home page.`,
        showInSettings: true
    } as SettingConfig<boolean>
} satisfies Record<string, SettingConfig<SettingValue>>;

export type SettingsKey = keyof typeof settingsConfig;
export type SettingsConfig = {
    [key in SettingsKey]: Settings<(typeof settingsConfig)[key]['defaultValue']>;
};

namespace SettingsUtils {
    export function convertToMap(settings: Settings[]): SettingsConfig {
        return Object.fromEntries(settings.map(s => [s.key, s])) as SettingsConfig;
    }

    export function fillWithDefaults(map: Record<string, Settings>): SettingsConfig {
        const newMap = { ...map };
        for (const [key, config] of Object.entries(settingsConfig)) {
            if (!newMap[key]) {
                newMap[key] = { id: '', created: 0, key, value: config.defaultValue };
            }
        }
        return newMap as SettingsConfig;
    }
}

export const Settings = SettingsUtils;
