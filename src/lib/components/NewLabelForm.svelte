<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
    import { api } from '../utils/apiRequest';
    import { displayNotifOnErr, ERR_NOTIFICATION, SUCCESS_NOTIFICATION } from '../utils/notifications';

    const dispatch = createEventDispatcher();
    const { addNotification } = getNotificationsContext();

    let labelName = '';
    let labelColour = '#000000';

    export let auth: App.PageData;

    async function closeHandler () {
        if (!labelName) {
            addNotification({
                ...ERR_NOTIFICATION,
                text: 'Invalid Name',
            });
            return;
        }

        displayNotifOnErr(addNotification,
            await api.post(auth, '/labels', {
                name: labelName,
                colour: labelColour,
            }),
        );

        addNotification({
            ...SUCCESS_NOTIFICATION,
            text: 'Label created',
        });

        labelName = '';

        dispatch('submit');
    }
</script>

<div>
    <div>
        <h1>Create New Label</h1>
    </div>
    <div class="content">
        <input bind:value={labelName} placeholder="Name" type="text" />
        <input bind:value={labelColour} type="color" />
    </div>
    <div class="actions">
        <button on:click={closeHandler}> Create</button>
    </div>
</div>

<style lang="less">
    @import '../../styles/variables.less';

    .content {
        text-align: center;
    }

    .actions {
        display: flex;
        justify-content: center;

        button {
            border: 1px solid @border;
            border-radius: 10px;
            padding: 1em;
            margin: 1em;

            &:hover {
                background-color: @light-accent;
            }
        }
    }
</style>
