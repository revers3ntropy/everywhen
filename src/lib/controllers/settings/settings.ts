import { settingsConfig } from './settingsConfig';

export type SettingValue = string | boolean | number;

export interface SettingConfig<T extends SettingValue> {
    type: 'string' | 'boolean' | 'number' | string[];
    name: string;
    description: string;
    defaultValue: T;
    showInSettings: boolean;
    unit?: string;
}

export interface Settings<T = unknown> {
    id: string;
    created: number;
    key: string;
    value: T;
}

export type SettingsKey = keyof typeof settingsConfig;
export type SettingsConfig = {
    [key in SettingsKey]: Settings<(typeof settingsConfig)[key]['defaultValue']>;
};

export namespace Settings {
    export function fillWithDefaults(map: Record<string, Settings>): SettingsConfig {
        const newMap = { ...map };
        for (const [key, config] of Object.entries(settingsConfig)) {
            newMap[key] ||= { id: '', created: 0, key, value: config.defaultValue };
        }
        return newMap as SettingsConfig;
    }

    export const config = settingsConfig;
}
