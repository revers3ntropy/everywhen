<script lang="ts">
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import { tooltip } from '@svelte-plugins/tooltips';
    import FormatListBulleted from 'svelte-material-icons/FormatListBulleted.svelte';
    import TextBoxOutline from 'svelte-material-icons/TextBoxOutline.svelte';
    import type { Auth } from '$lib/controllers/user.js';
    import EntryForm from './EntryForm.svelte';
    import BulletEntriesForm from '$lib/components/entryForm/BulletEntriesForm.svelte';
    import { localStorageWritable } from '$lib/lsWritable.js';
    import { LS_KEY } from '$lib/constants.js';

    export let mode = localStorageWritable<EntryFormMode>(
        LS_KEY.journalingMode,
        EntryFormMode.Standard
    );

    export let auth: Auth;
    export let obfuscated = true;

    export let resetEntryForm: () => void;

    function switchMode() {
        $mode =
            $mode === EntryFormMode.Standard
                ? EntryFormMode.Bullet
                : EntryFormMode.Standard;
    }
</script>

<div class="flex-center" style="justify-content: end">
    {#key $mode}
        <button
            on:click={switchMode}
            use:tooltip={{
                content:
                    $mode === EntryFormMode.Standard
                        ? 'Switch to Bullet Journaling'
                        : 'Switch to Standard Journaling',
                position: 'left'
            }}
            class="with-circled-icon"
        >
            {#if $mode === EntryFormMode.Standard}
                <FormatListBulleted size="30" />
            {:else}
                <TextBoxOutline size="30" />
            {/if}
        </button>
    {/key}
</div>

{#if $mode === EntryFormMode.Standard}
    <EntryForm {auth} {obfuscated} bind:resetEntryForm />
{:else}
    <BulletEntriesForm {auth} {obfuscated} bind:resetEntryForm />
{/if}
