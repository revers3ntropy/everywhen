<script lang="ts">
    import { obfuscated, passcodeLastEntered, settingsStore, username } from '$lib/stores';
    import AccountDropdown from '$lib/components/nav/AccountDropdown.svelte';
    import CreateNewButton from '$lib/components/nav/CreateNewButton.svelte';
    import Lock from 'svelte-material-icons/Lock.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import { tooltip } from '@svelte-plugins/tooltips';

    function lock() {
        passcodeLastEntered.set(0);
    }
</script>

<div
    class="flex fixed top-0 right-2 left-0 z-10 bg-navBg justify-between items-center"
    style="height: 50px"
>
    <div class="w-fit h-fit">
        <CreateNewButton />
    </div>
    <div class="flex items-center gap-2 md:gap-4">
        {#if $settingsStore.passcode.value}
            <button
                on:click={lock}
                class="danger"
                use:tooltip={{
                    content: '<span class="oneline">Lock (require passcode)</span>',
                    position: 'bottom'
                }}
                aria-label="Lock"
            >
                <Lock size="25" />
            </button>
        {/if}
        <button
            aria-label={$obfuscated ? 'Show all' : 'Hide all'}
            on:click={() => obfuscated.set(!$obfuscated)}
        >
            {#if $obfuscated}
                <Eye size="25" />
            {:else}
                <EyeOff size="25" />
            {/if}
        </button>

        <div class="pr-1">
            <AccountDropdown>
                <p> {$username || '...'} </p>
            </AccountDropdown>
        </div>
    </div>
</div>
