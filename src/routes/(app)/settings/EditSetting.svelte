<script lang="ts">
    import LocationSelector from '$lib/components/location/LocationSelector.svelte';
    import Dot from '$lib/components/ui/Dot.svelte';
    import { Switch } from '$lib/components/ui/switch';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { fmtDuration, nowUtc } from '$lib/utils/time';
    import type { SettingsConfig, SettingValue } from '$lib/controllers/settings/settings';
    import { settingsStore } from '$lib/stores';
    import type { OptionalCoords } from '../../../types';

    export let key: string;
    export let defaultValue: SettingValue;
    export let name: string;
    export let type: string | string[];
    export let description: string;
    export let unit = '';
    export let value: SettingValue;
    export let created = null as number | null;

    let inputType: 'text' | 'number' | 'checkbox' | 'select' | 'location';

    if (!type || !key) throw new Error('Missing type or key');

    switch (type) {
        case 'string':
            inputType = 'text';
            break;
        case 'number':
            inputType = 'number';
            break;
        case 'boolean':
            inputType = 'checkbox';
            break;
        case 'location':
            inputType = type;
            break;
        default:
            if (Array.isArray(type)) {
                inputType = 'select';
                break;
            }

            throw new Error(`Unknown input type for ${key}`);
    }

    async function updateValue(newValue: SettingValue) {
        value = newValue;
        created = nowUtc();

        let k = key as keyof SettingsConfig;
        const changes = {
            key: k,
            value: newValue
        };

        notify.onErr(await api.put('/settings', changes));

        $settingsStore[k].value = newValue;
        $settingsStore[k].created = nowUtc();

        notify.success('Settings updated');
    }

    async function onInput(event: Event) {
        if (type === 'location') {
            await updateValue((event as CustomEvent<OptionalCoords>).detail);
            return;
        }
        let target = event.target as HTMLInputElement;
        let newValue: boolean | string | number = target.value;
        if (type === 'boolean') {
            newValue = target.checked;
        }
        if (type === 'number') {
            newValue = Number(newValue);
        }

        await updateValue(newValue);
    }

    async function onCheckedChange(value: boolean) {
        await updateValue(value);
    }
</script>

<div class="wrapper" id={key}>
    <div class="left">
        <div class="flex-center w-fit">
            <p class="oneline">
                {name}
            </p>

            {#if created}
                <p class="text-sm hide-mobile">
                    <span class="oneline text-light">
                        <Dot light />
                        Last updated
                        {fmtDuration(nowUtc() - created)}
                        ago
                    </span>
                </p>
            {/if}
            {#if value !== defaultValue && inputType !== 'checkbox'}
                <p class="text-sm hide-mobile text-light">
                    <span class="oneline">
                        <Dot light />
                        <button on:click={() => updateValue(defaultValue)}>
                            {#if Array.isArray(defaultValue) && defaultValue[0] === null}
                                Remove
                            {:else}
                                Restore default ({JSON.stringify(defaultValue)})
                            {/if}
                        </button>
                    </span>
                </p>
            {/if}
        </div>
        <p class="text-sm text-light pt-1 pb-2">
            {description}
        </p>
    </div>
    <div class="right">
        <label class="label-for-{inputType}">
            {#if inputType === 'select'}
                <select class="text-box" on:change={onInput}>
                    {#each type as option}
                        <option value={option} selected={option === value}>
                            {option}
                        </option>
                    {/each}
                </select>
            {:else if inputType === 'location'}
                <!-- value is always an array, but need a check to satisfy the type system -->
                {#if Array.isArray(value)}
                    <LocationSelector
                        {value}
                        on:change={onInput}
                        height="25vh"
                        mobileHeight="25vh"
                    />
                {:else}
                    Something went wrong!
                {/if}
            {:else if inputType === 'checkbox'}
                <Switch checked={!!value} {onCheckedChange} />
                {unit}
            {:else}
                <Textbox
                    type={inputType}
                    value={value.toString()}
                    onChange={updateValue}
                    endUnit={unit}
                    thinBorder
                />
            {/if}
        </label>
    </div>
</div>

<style lang="scss">
    @import '$lib/styles/layout';

    .wrapper {
        display: grid;
        grid-template-columns: 1fr 25rem;

        @media only screen and (max-width: 1024px) {
            display: block;
        }

        border: 1px solid transparent;

        &:target {
            border: 1px solid var(--border-light);
            border-radius: $border-radius;
        }
    }

    .label-for-checkbox {
        // https://www.w3schools.com/howto/howto_css_custom_checkbox.asp
        display: block;
        position: relative;
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;

        .checkmark {
            position: absolute;
            top: 0;
            left: 0;
            height: 25px;
            width: 25px;
            background-color: var(--light-accent);
            border-radius: 0.5rem;

            &:after {
                margin: 1px;
                content: '';
                position: absolute;
                display: none;
                left: 9px;
                top: 5px;
                width: 5px;
                height: 10px;
                border: solid var(--text-colour-on-gradient);
                border-width: 0 3px 3px 0;
                -webkit-transform: rotate(45deg);
                -ms-transform: rotate(45deg);
                transform: rotate(45deg);
            }
        }

        input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;

            &:checked ~ .checkmark {
                display: block;
            }
        }

        &:hover input ~ .checkmark {
            background-color: var(--border-heavy);
        }

        &:hover input:checked ~ .checkmark {
            background: var(--primary);
        }

        input:checked ~ .checkmark {
            background: var(--accent-gradient);
        }

        input:checked ~ .checkmark:after {
            display: block;
        }
    }

    input {
        margin: 0 0 0.5rem 0;
        border-radius: $border-radius;

        @media #{$mobile} {
            margin-top: 0.5rem;
        }

        &:not([type='text']) {
            cursor: pointer;
        }
    }

    label {
        i {
            font-size: 0.8rem;
        }
    }
</style>
