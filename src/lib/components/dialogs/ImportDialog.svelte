<script lang="ts">
    import FileDrop from "./FileDropDialog.svelte";
    import type { Auth } from "../../types";
    import { entries } from "./importEntries.js";
    import { getNotificationsContext } from "svelte-notifications";
    import Spinner from "$lib/components/Spinner.svelte";
    import { onMount } from "svelte";
    import { api } from "../../api/apiQuery";

    const { addNotification } = getNotificationsContext();

    export let auth: Auth;

    let labels = [];

    onMount(async () => {
        const labelRes = await api.get(auth, "/labels");
        labels = labelRes.labels;
    });

</script>

{#if labels.length}
    <FileDrop
        message="Import Entries from .json file"
        withContents={async (contents) => {
            const res = await entries(contents, labels, auth);
            if (Array.isArray(res)) {
                for (const notification of res) {
                    addNotification(notification);
                }
            }
            else if (res) {
                addNotification(res);
            }
        }}
    />
{:else}
    <Spinner scale={0.5} />
{/if}
