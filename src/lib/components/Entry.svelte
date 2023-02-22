<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getNotificationsContext } from "svelte-notifications";
    import DomPurify from "dompurify";
    import moment from "moment";
    import { marked } from "marked";
    import Bin from "svelte-material-icons/Delete.svelte";
    import Eye from "svelte-material-icons/Eye.svelte";
    import EyeOff from "svelte-material-icons/EyeOff.svelte";
    import Restore from "svelte-material-icons/DeleteRestore.svelte";
    import { api } from "../api/apiQuery";
    import { getAuth, obfuscate } from "../utils";
    import Label from "./Label.svelte";

    const dispatch = createEventDispatcher();
    const { addNotification } = getNotificationsContext();

    export let id = "";
    export let title = "";
    export let entry = "";
    export let created = 0;
    export let label: Label | null = null;
    export let latitude: number | null = null;
    export let longitude: number | null = null;
    export let deleted = false;

    export let obfuscated = true;
    export let showLabels = true;

    // show random string instead of text content if obfuscated
    export let showLabel: Label | null;
    $: showLabel = showLabels && label ? {
        ...label,
        name: obfuscated ? obfuscate(label.name) : label.name
    } : null;

    async function deleteSelf () {
        if (!confirm(`Are you sure you want to ${ deleted ? "restore" : "delete" } this entry?`)) {
            return;
        }

        const res = await api.delete(getAuth(), `/entries/${ id }`, {
            restore: deleted
        });

        if (res.id) {
            addNotification({
                removeAfter: 4000,
                text: `Entry ${ deleted ? "restored" : "deleted" }`,
                type: "success",
                position: "top-center"
            });
            dispatch("updated");
            return;
        }

        addNotification({
            removeAfter: 4000,
            text: `Error deleting entry ${ res.body.message }`,
            type: "error",
            position: "top-center"
        });
    }

    function toggleObfuscation () {
        obfuscated = !obfuscated;
    }

    $: entryHtml = DomPurify.sanitize(
        marked(obfuscated ? obfuscate(entry) : entry),
        { USE_PROFILES: { html: true } }
    );
</script>

<div class="entry">
    <div class="header">
        <div>
			<span class="time">
				{moment(new Date(created * 1000)).format('h:mm A')}
			</span>
            <Label label={showLabel} obfuscated={obfuscated} />
        </div>
        <div class="title {obfuscated ? 'obfuscated' : ''}">
            {obfuscated ? obfuscate(title) : title}
        </div>

        <div>
            {#if !obfuscated}
                <button on:click={deleteSelf}>
                    {#if deleted}
                        <Restore size="25" />
                    {:else}
                        <Bin size="25" />
                    {/if}
                </button>
            {/if}

            <button on:click={toggleObfuscation}>
                {#if obfuscated}
                    <Eye size="25" />
                {:else}
                    <EyeOff size="25" />
                {/if}
            </button>
        </div>
    </div>
    <p class="body {obfuscated ? 'obfuscated' : ''}">
        {@html entryHtml}
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

        @media @mobile {
            padding: 0;
        }
    }

    .header {
        border-bottom: 1px solid @border;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0.5em 2em 0 0;
        padding: 0.3em;

        @media @mobile {
            margin: 0;
        }
    }

    .title {
        font-size: 1.2em;
    }

    .time {
        margin: 0 0 0 0.5rem;
        font-size: 0.8em;
        color: @text-color-light;
    }

    .body {
        margin: 0 3em;
        word-break: break-word;
    }
</style>
