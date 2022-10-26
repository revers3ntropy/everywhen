<script lang="ts">
    import Bin from 'svelte-material-icons/Delete.svelte';
    import { createEventDispatcher } from 'svelte';
    import { api } from "../api/apiQuery";
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
        await api.delete(`/entries`, { id: id });
        dispatch('updated');
    }

    let date: Date;
    $: date = new Date(created * 1000);
</script>
<div class="entry">
    <div class="header">
        <div>
            {date.getHours() % 12}:{date.getMinutes().toString().padStart(2, '0')}
            {date.getHours() < 12 ? 'am' : 'pm'}
            <span class="title">{title}</span>
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
        padding: 1em;
        border-radius: 3px;
        margin: 1em 0;
        height: fit-content;
        //border-bottom: 1px solid @border;
    }

    .header {
        border-bottom: 1px solid @border-light;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0.5em;
        padding: 0.5em;
    }

    .title {
        font-weight: bold;
        margin-left: 2em;
        font-size: 1.2em;
    }

    h3 {
        padding: 0;
        margin: 0.5em;
    }

    .body {
        margin: 0 3em;
    }
</style>