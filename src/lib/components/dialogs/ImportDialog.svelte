<script lang="ts">
    import { onMount } from 'svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import Spinner from '../../../lib/components/BookSpinner.svelte';
    import type { Label } from '../../controllers/label';
    import type { Auth } from '../../controllers/user';
    import { api } from '../../utils/apiRequest';
    import {
        displayNotifOnErr,
        ERR_NOTIFICATION
    } from '../../utils/notifications';
    import type { Result } from '../../utils/result';
    import FileDrop from './FileDropDialog.svelte';
    import { importEntries } from './importEntries.js';
    import { importEvents } from './importEvents';

    const { addNotification } = getNotificationsContext();

    export let auth: Auth;
    export let type: 'events' | 'entries';

    let labels: Label[] | null = null;

    let loading = false;

    async function withContents(result: Result<string>): Promise<void> {
        const contents = displayNotifOnErr(addNotification, result);

        if (!labels) {
            addNotification({
                ...ERR_NOTIFICATION,
                text: `Failed to load labels`
            });
            return;
        }

        loading = true;

        let res;
        if (type === 'events') {
            res = await importEvents(contents, labels, auth);
        } else if (type === 'entries') {
            res = await importEntries(contents, labels, auth);
        } else {
            throw new Error('Invalid type');
        }

        // handle error messages
        if (Array.isArray(res)) {
            for (const notification of res) {
                addNotification({
                    ...ERR_NOTIFICATION,
                    ...notification
                });
            }
        } else if (res) {
            addNotification({
                ...ERR_NOTIFICATION,
                ...res
            });
        }

        loading = false;
    }

    onMount(async () => {
        const labelRes = displayNotifOnErr(
            addNotification,
            await api.get(auth, '/labels')
        );
        labels = labelRes.labels;
    });
</script>

{#if labels && !loading}
    <FileDrop
        message="Import {type} from .json file"
        withContents="{withContents}"
    />
{:else}
    <Spinner scale="{0.5}" />
{/if}
