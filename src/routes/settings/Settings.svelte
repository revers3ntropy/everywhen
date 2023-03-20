<script lang="ts">
    import moment from 'moment';
    import CloudSyncOutline from 'svelte-material-icons/CloudSyncOutline.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import { api } from '../../lib/api/apiQuery';
    import type { Auth } from '../../lib/controllers/user';
    import { displayNotifOnErr } from '../../lib/utils/notifications.js';
    import { nowS } from '../../lib/utils/time.js';

    const { addNotification } = getNotificationsContext();

    export let id: string;
    export let auth: Auth;
    export let key: string;
    export let defaultValue: any;
    export let name: string;
    export let type: string;
    export let description: string;
    export let value: any;
    export let created: number | null = null;

    let saving = false;

    let inputType;

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

    async function onInput (event) {
        let newValue = event.target.value;
        if (type === 'boolean') {
            newValue = event.target.checked;
        }
        if (type === 'number') {
            newValue = Number(newValue);
        }
        await updateValue(newValue);
    }
</script>

<div>
    <div class="header">
        <h3>
            {name}

            {#if saving}
                <CloudSyncOutline />
            {/if}
        </h3>
        {#if created}
            <p class="last-updated">
                Last updated
                {moment.duration(nowS() - created, 's')
                    .humanize()}
            </p>
        {/if}
        {#if value !== defaultValue}
            <p class="restore">
                <button on:click={() => updateValue(defaultValue)}>
                    Restore default ({defaultValue})
                </button>
            </p>
        {/if}
    </div>
    <label>
        <input
            checked={inputType === 'checkbox' && value}
            class="text-box"
            on:change={onInput}
            type={inputType}
            value={value}
        />
        <br>
        <i>{description}</i>
    </label>
</div>

<style lang="less">
    @import '../../styles/variables.less';

    input {
        margin: 0 0 .5rem 0;

        &:not([type="text"]) {
            cursor: pointer;
        }

        &[type="checkbox"] {
            scale: 1.5;
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

        & > * {
            padding: 0 1em;
            margin: .3em 0;
            border-right: 1px solid @border;
            text-align: center;
            display: grid;
            place-items: center;

            &:last-child {
                border-right: none;
            }
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