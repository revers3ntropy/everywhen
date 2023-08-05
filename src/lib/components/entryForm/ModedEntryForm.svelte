<script lang="ts">
    import BookSpinner from '$lib/components/BookSpinner.svelte';
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import type { SettingsKey } from '$lib/controllers/settings/settings';
    import { api } from '$lib/utils/apiRequest';
    import EntryForm from './EntryForm.svelte';
    import BulletEntriesForm from '$lib/components/entryForm/BulletEntriesForm.svelte';
    import { settingsStore } from '$lib/stores';

    export let obfuscated = true;
    export let entryFormMode: EntryFormMode;

    async function setEntryFormMode(mode: EntryFormMode) {
        const newSetting = {
            key: 'entryFormMode' as SettingsKey,
            value: mode !== EntryFormMode.Standard
        };
        $settingsStore.entryFormMode = {
            ...$settingsStore.entryFormMode,
            value: newSetting.value
        };
        await api.put('/settings', newSetting);
    }
</script>

{#if entryFormMode === null}
    <BookSpinner />
{:else if entryFormMode === EntryFormMode.Standard}
    <EntryForm {obfuscated} {setEntryFormMode} />
{:else}
    <BulletEntriesForm {obfuscated} {setEntryFormMode} />
{/if}
