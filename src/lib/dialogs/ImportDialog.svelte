<script lang="ts">
    import { onMount } from 'svelte';
    import Spinner from '$lib/components/BookSpinner.svelte';
    import type { Label } from '$lib/controllers/label';
    import type { Auth } from '$lib/controllers/user';
    import { api } from '$lib/utils/apiRequest';
    import {
        addNotification,
        displayNotifOnErr,
        notify,
        NotificationType
    } from '$lib/notifications/notifications';
    import type { Result } from '$lib/utils/result';
    import FileDrop from './FileDropDialog.svelte';
    import { importEntries } from './importEntries.js';
    import { importEvents } from './importEvents';

    export let auth: Auth;
    export let type: 'events' | 'entries';

    let labels: Label[] | null = null;

    let loading = false;

    async function withContents(result: Result<string>): Promise<void> {
        const contents = displayNotifOnErr(result);

        if (!labels) {
            notify.error('Failed to load labels');
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
                    type: NotificationType.ERROR,
                    text: '',
                    timeout: 3000,
                    ...notification
                });
            }
        } else if (res) {
            addNotification({
                type: NotificationType.ERROR,
                text: '',
                timeout: 3000,
                ...res
            });
        }

        loading = false;
    }

    onMount(async () => {
        const labelRes = displayNotifOnErr(await api.get(auth, '/labels'));
        labels = labelRes.labels;
    });
</script>

{#if labels && !loading}
    <FileDrop message="Import {type} from .json file" {withContents} />
{:else}
    <Spinner scale={0.5} />
{/if}
