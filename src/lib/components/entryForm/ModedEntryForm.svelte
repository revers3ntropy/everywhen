<script lang="ts">
    import BookSpinner from '$lib/components/BookSpinner.svelte';
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import type { SettingsKey } from '$lib/controllers/settings';
    import type { Auth } from '$lib/controllers/user.js';
    import { dispatch } from '$lib/dataChangeEvents';
    import { api } from '$lib/utils/apiRequest';
    import EntryForm from './EntryForm.svelte';
    import BulletEntriesForm from '$lib/components/entryForm/BulletEntriesForm.svelte';

    export let auth: Auth;
    export let obfuscated = true;
    export let entryFormMode: EntryFormMode;

    async function setEntryFormMode(mode: EntryFormMode) {
        const newSetting = {
            key: 'entryFormMode' as SettingsKey,
            value: mode !== EntryFormMode.Standard
        };
        await Promise.all([
            dispatch.update('setting', newSetting),
            api.put(auth, '/settings', newSetting)
        ]);
    }
</script>

{#if entryFormMode === null}
    <BookSpinner />
{:else if entryFormMode === EntryFormMode.Standard}
    <EntryForm {auth} {obfuscated} {setEntryFormMode} />
{:else}
    <BulletEntriesForm {auth} {obfuscated} {setEntryFormMode} />
{/if}
