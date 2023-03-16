<script lang="ts">
    import { onMount } from 'svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import Spinner from '../../../lib/components/BookSpinner.svelte';
    import { api } from '../../api/apiQuery';
    import type { Label } from '../../controllers/label';
    import type { Auth } from '../../controllers/user';
    import { displayNotifOnErr, type Result } from '../../utils';
    import FileDrop from './FileDropDialog.svelte';
    import { entries } from './importEntries.js';

    const { addNotification } = getNotificationsContext();

    export let auth: Auth;

    let labels: Label[] = [];

    async function withContents (result: Result<string>): Promise<void> {
        const contents = displayNotifOnErr(addNotification, result);
        const res = await entries(contents, labels, auth);
        if (Array.isArray(res)) {
            for (const notification of res) {
                addNotification(notification);
            }
        } else if (res) {
            addNotification(res);
        }
    }

    onMount(async () => {
        const labelRes = displayNotifOnErr(addNotification,
            await api.get(auth, '/labels'),
        );
        labels = labelRes.labels;
    });

</script>

{#if labels.length}
    <FileDrop
        message="Import Entries from .json file"
        {withContents}
    />
{:else}
    <Spinner scale={0.5} />
{/if}
