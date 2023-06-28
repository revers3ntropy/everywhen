<script lang="ts">
    import { Label } from '$lib/controllers/label';
    import { dispatch } from '$lib/dataChangeEvents';
    import { nowUtc } from '$lib/utils/time';
    import { createEventDispatcher } from 'svelte';
    import type { Auth } from '$lib/controllers/user';
    import { Event } from '$lib/controllers/event';
    import { api } from '$lib/utils/apiRequest';
    import {
        displayNotifOnErr,
        notify
    } from '$lib/components/notifications/notifications';

    const dispatchEvent = createEventDispatcher();

    let labelName = '';
    let labelColor = Event.DEFAULT_COLOR;

    export let auth: Auth;

    async function closeHandler() {
        if (!labelName) {
            notify.error('Invalid Name');
            return;
        }

        const { id } = displayNotifOnErr(
            await api.post(auth, '/labels', {
                name: labelName,
                color: labelColor
            })
        );

        notify.success('Label created');
        await dispatch.create(
            'label',
            new Label(id, labelColor, labelName, nowUtc())
        );
        labelName = '';

        dispatchEvent('submit');
    }
</script>

<div>
    <div>
        <h1>Create New Label</h1>
    </div>
    <div class="content">
        <label>
            Name<br />
            <input bind:value={labelName} type="text" />
        </label>
        <label>
            Color<br />
            <input bind:value={labelColor} type="color" />
            <input bind:value={labelColor} type="text" />
        </label>
    </div>
    <div class="actions">
        <button class="primary" on:click={closeHandler}> Create </button>
    </div>
</div>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/text';

    .content {
        margin-left: 10vw;

        label {
            .text-light();

            display: block;
            margin: 1rem;

            input {
                margin: 0.2rem 0 0 0;
            }
        }
    }

    .actions {
        display: flex;
        justify-content: center;

        button {
            border: 1px solid var(--border-color);
            border-radius: @border-radius;
            padding: 1em;
            margin: 1em;

            &:hover {
                background-color: var(--light-accent);
            }
        }
    }
</style>
