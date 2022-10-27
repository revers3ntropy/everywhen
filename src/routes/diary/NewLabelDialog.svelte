<script lang="ts">
    import { getNotificationsContext } from 'svelte-notifications';
    import { api } from "$lib/api/apiQuery";

    const { addNotification } = getNotificationsContext();

    let labelName = '';
    let labelColour = '#000000';

    export let key: string;

    async function closeHandler() {
        if (!labelName) {
            addNotification({
                text: 'Invalid Name',
                position: 'top-center',
                type: 'error'
            });
            return;
        }

        const res = await api.post(key, '/labels', {
            name: labelName,
            colour: labelColour
        });

        if (!res.id) {
            addNotification({
                text: 'Error creating label: ' + res.toString(),
                position: 'top-center',
                type: 'error'
            });
            return;
        }

        console.log(res);
    }
</script>
<div>
    <div>
        <h1>Create New Label</h1>
    </div>
    <div class="content">
        <input type="text" bind:value={labelName} placeholder="Name" />
        <input type="color" bind:value={labelColour} />
    </div>
    <div class="actions">
        <button on:click={ closeHandler}>
            Create
        </button>
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