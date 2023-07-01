import * as server from './settings.server';
import * as client from './settings.client';

export type SettingValue = string | boolean | number;

export interface SettingConfig<T extends SettingValue> {
    type: 'string' | 'boolean' | 'number';
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

export type SettingsKey = client.SettingsKey;
export type SettingsConfig = client.SettingsConfig;

export const Settings = {
    ...server.Settings,
    ...client.Settings
};
