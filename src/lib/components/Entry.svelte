<script lang="ts">
    import Bin from 'svelte-material-icons/Delete.svelte';
    import { createEventDispatcher } from 'svelte';
    import { api } from "../api/apiQuery";
    import { getKey, randomString } from "../utils";
    import moment from "moment";
    import Label from "./Label.svelte";
    const dispatch = createEventDispatcher();

    export let id;
    export let title;
    export let entry;
    export let created = 0;
    export let label = null;
    export let latitude;
    export let longitude;
    export let deleted;

    export let obfuscated = false;

    $: if (obfuscated) {
        title = randomString(title.length);
        entry = randomString(entry.length);
        if (label) {
            label.name = randomString(label.name.length);
        }
    }

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
            <Label {label} />
        </div>
        <div class="title">
            {title}
        </div>

        <div>
            <button on:click={del}>
                <Bin size="25" />
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
    }
</style>