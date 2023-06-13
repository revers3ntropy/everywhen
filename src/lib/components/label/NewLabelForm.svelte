<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Auth } from '$lib/controllers/user';
    import { api } from '$lib/utils/apiRequest';
    import {
        displayNotifOnErr,
        notify
    } from '$lib/notifications/notifications';

    const dispatch = createEventDispatcher();

    let labelName = '';
    let labelColour = '#000000';

    export let auth: Auth;

    async function closeHandler() {
        if (!labelName) {
            notify.error('Invalid Name');
            return;
        }

        displayNotifOnErr(
            await api.post(auth, '/labels', {
                name: labelName,
                colour: labelColour
            })
        );

        notify.success('Label created');

        labelName = '';

        dispatch('submit');
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
            Colour<br />
            <input bind:value={labelColour} type="color" />
            <input bind:value={labelColour} type="text" />
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
            border: 1px solid @border;
            border-radius: @border-radius;
            padding: 1em;
            margin: 1em;

            &:hover {
                background-color: @light-accent;
            }
        }
    }
</style>
