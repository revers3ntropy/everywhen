<script lang="ts">
    import Bin from 'svelte-material-icons/Delete.svelte';
    import { createEventDispatcher } from 'svelte';
    import { api } from "../api/apiQuery";
    import { getKey } from "../utils";
    import moment from "moment";
    const dispatch = createEventDispatcher();

    export let id;
    export let title;
    export let entry;
    export let created = 0;
    export let label = null;
    export let latitude;
    export let longitude;
    export let deleted;

    async function del () {
        await api.delete(getKey(), `/entries`, { id: id });
        dispatch('updated');
    }
</script>
<div class="entry">
    <div class="header">
        <div>
            <span class="time">
                {moment(new Date(created * 1000)).format('h:mm A')}
            </span>
            <span class="title">
                {title}
            </span>
        </div>

        <div>
            <button on:click={del}>
                <Bin />
            </button>
        </div>
    </div>
    <p class="body">
        {@html entry}
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
        border-bottom: 1px solid @border-light;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: .5em 1em 0 0;
        padding: .3em;
    }

    .title {
        font-weight: bold;
        margin-left: 2em;
        font-size: 1.2em;
    }

    .time {
        margin: 0 0 0 0.5rem;
        font-size: .8em;
        color: @text-color-light;
    }

    h3 {
        padding: 0;
        margin: 0.5em;
    }

    .body {
        margin: 0 3em;
    }
</style>