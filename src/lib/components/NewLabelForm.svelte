<script lang="ts">
    import { getNotificationsContext } from "svelte-notifications";
    import { api } from "$lib/api/apiQuery";
    import { popup } from "$lib/constants";
    import { createEventDispatcher } from "svelte";
    import type { Auth } from "$lib/types";

    const dispatch = createEventDispatcher();
    const { addNotification } = getNotificationsContext();

    let labelName = "";
    let labelColour = "#000000";

    export let auth: Auth;

    async function closeHandler () {
        if (!labelName) {
            addNotification({
                text: "Invalid Name",
                position: "top-center",
                type: "error",
                removeAfter: 6000
            });
            return;
        }

        const res = await api.post(auth, '/labels', {
            name: labelName,
            colour: labelColour
        });

        if (!res.id) {
            addNotification({
                text: `Error creating label: ${res.body.message}`,
                position: 'top-center',
                type: 'error',
                removeAfter: 6000
            });
            popup.set(null);
            return;
        }

        addNotification({
            text: 'Label created',
            position: 'top-center',
            type: 'success',
            removeAfter: 3000
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
