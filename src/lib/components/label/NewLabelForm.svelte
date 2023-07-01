<script lang="ts">
    import type { Label } from '$lib/controllers/label/label';
    import { dispatch } from '$lib/dataChangeEvents';
    import { nowUtc } from '$lib/utils/time';
    import { createEventDispatcher } from 'svelte';
    import type { Auth } from '$lib/controllers/user/user';
    import { Event } from '$lib/controllers/event/event';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr, notify } from '$lib/components/notifications/notifications';

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

        const label: Label = { id, color: labelColor, name: labelName, created: nowUtc() };
        await dispatch.create('label', label);

        labelName = '';

        notify.success('Label created');
        dispatchEvent('submit');
    }
</script>

<div>
    <div>
        <h1>Create New Label</h1>
    </div>
    <div class="content">
        <label>
            Name <br />
            <input bind:value={labelName} type="text" />
        </label>
        <label>
            Color <br />
            <input bind:value={labelColor} type="color" />
            <input bind:value={labelColor} type="text" />
        </label>
    </div>
    <div class="actions">
        <button class="primary" on:click={closeHandler} aria-label="Create"> Create </button>
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
