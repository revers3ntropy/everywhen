<script lang="ts">
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import { tooltip } from '@svelte-plugins/tooltips';
    import FormatListBulleted from 'svelte-material-icons/FormatListBulleted.svelte';
    import TextBoxOutline from 'svelte-material-icons/TextBoxOutline.svelte';
    import type { Auth } from '$lib/controllers/user.js';
    import EntryForm from './EntryForm.svelte';
    import BulletEntriesForm from '$lib/components/entryForm/BulletEntriesForm.svelte';
    import { entryFormMode } from '$lib/stores';

    export let auth: Auth;
    export let obfuscated = true;

    export let resetEntryForm: () => void;

    function switchMode() {
        $entryFormMode =
            $entryFormMode === EntryFormMode.Standard
                ? EntryFormMode.Bullet
                : EntryFormMode.Standard;
    }
</script>

<div class="flex-center" style="justify-content: end">
    {#key $entryFormMode}
        <button
            on:click={switchMode}
            use:tooltip={{
                content:
                    $entryFormMode === EntryFormMode.Standard
                        ? 'Switch to Bullet Journaling'
                        : 'Switch to Standard Journaling',
                position: 'left'
            }}
            class="with-circled-icon"
        >
            {#if $entryFormMode === EntryFormMode.Standard}
                <FormatListBulleted size="30" />
            {:else}
                <TextBoxOutline size="30" />
            {/if}
        </button>
    {/key}
</div>

{#if $entryFormMode === EntryFormMode.Standard}
    <EntryForm {auth} {obfuscated} bind:resetEntryForm />
{:else}
    <BulletEntriesForm {auth} {obfuscated} bind:resetEntryForm />
{/if}
