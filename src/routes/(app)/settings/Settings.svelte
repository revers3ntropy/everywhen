<script lang="ts">
    import LocationSelector from '$lib/components/location/LocationSelector.svelte';
    import Dot from '$lib/components/ui/Dot.svelte';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { tooltip } from '@svelte-plugins/tooltips';
    import CloudCheckOutline from 'svelte-material-icons/CloudCheckOutline.svelte';
    import Sync from 'svelte-material-icons/Sync.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { currentTzOffset, fmtDuration, fmtUtc, nowUtc } from '$lib/utils/time';
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

    let saving = false;

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
        saving = true;

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

        saving = false;
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
</script>

<div class="wrapper" id={key}>
    <div class="left">
        <div class="header">
            <div>
                <h2 class="oneline">
                    {#if saving}
                        <Sync size={20} class="gradient-icon" />
                    {:else}
                        <CloudCheckOutline size={20} />
                    {/if}
                    {name}
                </h2>
            </div>

            {#if created}
                <p
                    class="last-updated hide-mobile"
                    use:tooltip={{
                        content: fmtUtc(created, currentTzOffset(), 'DD/MM/YYYY h:mma')
                    }}
                >
                    <span class="oneline">
                        <Dot light />
                        Last updated
                        {fmtDuration(nowUtc() - created)}
                        ago
                    </span>
                </p>
            {/if}
            {#if value !== defaultValue}
                <p class="restore hide-mobile">
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
        <p class="description">
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
                    <LocationSelector {value} on:change={onInput} height="25vh" />
                {:else}
                    Something went wrong!
                {/if}
            {:else if inputType === 'checkbox'}
                <input
                    checked={!!value}
                    class="textbox"
                    on:change={onInput}
                    type={inputType}
                    {value}
                />
                <span class="checkmark" />
                {unit}
            {:else}
                <Textbox
                    type={inputType}
                    value={value.toString()}
                    on:change={onInput}
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
        padding-inline: 1rem;

        @media #{$mobile} {
            display: block;
        }

        border: 1px solid transparent;

        &:target {
            border: 1px solid var(--border-light);
            border-radius: $border-radius;
        }

        .left,
        .right {
            padding: 0 0.5em;

            @media #{$mobile} {
                padding: 0;
            }
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

    .header {
        width: fit-content;
        display: flex;
        flex-direction: row;
        margin: 0.1em 0;

        @media #{$mobile} {
            flex-direction: column;
        }

        & > * {
            padding: 0 0.2rem;
            margin: 0.3em 0;
            text-align: center;
            display: grid;
            place-items: center;

            @media #{$mobile} {
                display: block;
                text-align: left;
                border-right: none;
            }

            &:last-child {
                border-right: none;
            }
        }

        h2 {
            font-size: 20px;
            display: grid;
            grid-template-columns: 40px 1fr;
            justify-content: center;
            align-items: center;
            margin: 0;
        }

        .last-updated {
            font-size: 0.85rem;
        }

        .restore {
            font-size: 0.85rem;

            button {
                color: var(--text-color-accent);

                &:hover {
                    color: var(--primary);
                }
            }
        }
    }

    .description {
        color: var(--text-color-light);
        margin: 10px 0;
    }
</style>
