<script lang="ts">
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Restore from 'svelte-material-icons/DeleteRestore.svelte';
    import { createEventDispatcher } from 'svelte';
    import { api } from "../api/apiQuery";
    import { getKey, obfuscate } from "../utils";
    import moment from "moment";
    import Label from "./Label.svelte";
    import { getNotificationsContext } from "svelte-notifications";
    const dispatch = createEventDispatcher();
    const { addNotification } = getNotificationsContext();

    export let id = '';
    export let title = '';
    export let entry = '';
    export let created = 0;
    export let label: Label | null = null;
    export let latitude: number | null = null;
    export let longitude: number | null = null;
    export let deleted = false;

    export let obfuscated = true;

    // show random string instead of text content if obfuscated
    let showLabel: Label | null;
    $: showLabel = label ? {
        ...label, name: obfuscated ? obfuscate(label.name) : label.name
    } : null;

    async function del () {
        const res = await api.delete(getKey(), `/entries`, {
            id,
            restore: deleted
        });

        if (res.id) {
            addNotification({
                removeAfter: 4000,
                text: `Entry ${deleted ? 'restored' : 'deleted'}`,
                type: 'success',
                position: `top-center`
            });
            dispatch('updated');
            return;
        }

        addNotification({
            removeAfter: 4000,
            text: `Error deleting entry ${res.body.message}`,
            type: 'error'
        });
    }

</script>
<div class="entry">
    <div class="header">
        <div>
            <span class="time">
                {moment(new Date(created * 1000)).format('h:mm A')}
            </span>
            <Label label={showLabel} />
        </div>
        <div class="title {obfuscated ? 'obfuscated' : ''}">
            {obfuscated ? obfuscate(title) : title}
        </div>

        <div>
            <button on:click={del}>
                {#if deleted}
                    <Restore size="25" />
                {:else}
                    <Bin size="25" />
                {/if}
            </button>
        </div>
    </div>
    <p class="body {obfuscated ? 'obfuscated' : ''}">
        {@html obfuscated ? obfuscate(entry) : entry}
    </p>
</div>
<style lang="less">
    @import '../../styles/variables.less';

    .entry {
        padding: 1em 0;
        border-radius: 3px;
        margin: 1em 0;
        height: fit-content;
        white-space: pre-wrap;
    }

    .header {
        border-bottom: 1px solid @border;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: .5em 2em 0 0;
        padding: .3em;
    }

    .title {
        font-size: 1.2em;
    }

    .time {
        margin: 0 0 0 0.5rem;
        font-size: .8em;
        color: @text-color-light;
    }

    .body {
        margin: 0 3em;
        word-break: break-all;
    }
</style>