<script lang="ts">
    // @ts-ignore
    import { tooltip } from '@svelte-plugins/tooltips';
    import CloudCheckOutline from 'svelte-material-icons/CloudCheckOutline.svelte';
    import Sync from 'svelte-material-icons/Sync.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { Auth } from '../../lib/controllers/user';
    import { api } from '../../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../../lib/utils/notifications.js';
    import { currentTzOffset, fmtDuration, fmtUtc, nowS } from '../../lib/utils/time.js';

    const { addNotification } = getNotificationsContext();

    export let id: string;
    export let auth: Auth;
    export let key: string;
    export let defaultValue: any;
    export let name: string;
    export let type: string;
    export let description: string;
    export let unit = '';
    export let value: any;
    export let created: number | null = null;

    let saving = false;

    let inputType: 'text' | 'number' | 'checkbox';

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
        default:
            throw new Error(`Unknown input type: ${key}`);
    }

    async function updateValue (newValue: unknown) {
        saving = true;

        value = newValue;
        created = nowS();

        displayNotifOnErr(addNotification,
            await api.put(auth, '/settings', {
                key,
                value: newValue,
            }),
        );

        saving = false;
    }

    async function onInput (event: Event) {
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

<div class="wrapper">
    <div class="left">
        <div class="header">
            <div>
                <h3>
                    {#if saving}
                        <Sync size={20} />
                    {:else}
                        <CloudCheckOutline size={20} />
                    {/if}
                    {name}
                </h3>
            </div>

            {#if created}
                <p
                    class="last-updated hide-mobile"
                    use:tooltip={{
                        content: fmtUtc(created, currentTzOffset(), 'DD/MM/YYYY h:mm A')
                    }}
                >
                    Last updated
                    {fmtDuration(nowS() - created)}
                    ago
                </p>
            {/if}
            {#if value !== defaultValue}
                <p class="restore hide-mobile">
                    <button on:click={() => updateValue(defaultValue)}>
                        Restore default ({JSON.stringify(defaultValue)})
                    </button>
                </p>
            {/if}
        </div>
        {description}
    </div>
    <div class="right">
        <label>
            <input
                checked={inputType === 'checkbox' && value}
                class="text-box"
                on:change={onInput}
                type={inputType}
                value={value}
            />
            {unit}
        </label>
    </div>
</div>

<style lang="less">
    @import '../../styles/layout';
    @import '../../styles/variables';

    .wrapper {
        display: grid;
        grid-template-columns: 1fr 1fr;
        padding: 1em 0.5em;

        @media @mobile {
            display: block;
        }

        .left, .right {
            margin: 0.5em;

            @media @mobile {
                margin: 0;
            }
        }
    }

    input {
        margin: 0 0 .5rem 0;

        @media @mobile {
            margin-top: 0.5rem;
        }

        &:not([type="text"]) {
            cursor: pointer;
        }

        &[type="checkbox"] {
            scale: 1.4;
            margin-left: 50px;
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
        margin: .1em 0;

        @media @mobile {
            flex-direction: column;
        }

        & > * {
            padding: 0 1em;
            margin: .3em 0;
            border-right: 1px solid @border;
            text-align: center;
            display: grid;
            place-items: center;

            @media @mobile {
                display: block;
                text-align: left;
                border-right: none;
            }

            &:last-child {
                border-right: none;
            }
        }

        h3 {
            display: grid;
            grid-template-columns: 40px 1fr;
            justify-content: center;
            align-items: center;
            margin: 0;
        }

        .last-updated {
            font-size: 0.8rem;
        }

        .restore button {
            color: @accent-color-primary;
            text-decoration: underline;

            &:hover {
                color: @accent-color-secondary
            }
        }
    }
</style>