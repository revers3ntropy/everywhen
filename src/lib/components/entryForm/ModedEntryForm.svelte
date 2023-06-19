<script lang="ts">
    import BookSpinner from '$lib/components/BookSpinner.svelte';
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import { tooltip } from '@svelte-plugins/tooltips';
    import FormatListBulleted from 'svelte-material-icons/FormatListBulleted.svelte';
    import TextBoxOutline from 'svelte-material-icons/TextBoxOutline.svelte';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import type { Auth } from '$lib/controllers/user.js';
    import EntryForm from './EntryForm.svelte';
    import BulletEntriesForm from '$lib/components/entryForm/BulletEntriesForm.svelte';
    import { entryFormMode } from '$lib/stores';

    export let auth: Auth;
    export let obfuscated = true;

    let collapsed = false;

    function switchMode() {
        entryFormMode.set(
            $entryFormMode === EntryFormMode.Standard
                ? EntryFormMode.Bullet
                : EntryFormMode.Standard
        );
    }
</script>

<div class="top-menu">
    <div />
    <div class="flex-center" style="justify-content: end">
        {#key collapsed}
            <button
                on:click={() => (collapsed = !collapsed)}
                use:tooltip={{
                    content: `<span class=oneline>${
                        collapsed === true
                            ? 'Show Entry Form'
                            : 'Hide Entry Form'
                    }</span>`,
                    position: 'left'
                }}
            >
                {#if collapsed}
                    <ChevronDown size="30" />
                {:else}
                    <ChevronUp size="30" />
                {/if}
            </button>
        {/key}
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
                {#if $entryFormMode === null}
                    ...
                {:else if $entryFormMode === EntryFormMode.Standard}
                    <FormatListBulleted size="30" />
                {:else}
                    <TextBoxOutline size="30" />
                {/if}
            </button>
        {/key}
    </div>
</div>

{#if !collapsed}
    <div>
        {#if $entryFormMode === null}
            <BookSpinner />
        {:else if $entryFormMode === EntryFormMode.Standard}
            <EntryForm {auth} {obfuscated} />
        {:else}
            <BulletEntriesForm {auth} {obfuscated} />
        {/if}
    </div>
{/if}

<style lang="less">
    .top-menu {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        justify-content: space-between;
    }
</style>
