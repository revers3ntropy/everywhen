<script lang="ts">
    import AccountCircleOutline from 'svelte-material-icons/AccountCircleOutline.svelte';
    import PlusThick from 'svelte-material-icons/PlusThick.svelte';
    import LightTheme from 'svelte-material-icons/WhiteBalanceSunny.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import CogOutline from 'svelte-material-icons/CogOutline.svelte';
    import DarkTheme from 'svelte-material-icons/WeatherNight.svelte';
    import { SubscriptionType } from '$lib/controllers/subscription/subscription';
    import Streaks from '$lib/components/Streaks.svelte';
    import { theme, username } from '$lib/stores';
    import { Theme } from '$lib/constants';
    import { Auth } from '$lib/controllers/auth/auth';
    import * as Popover from '$lib/components/ui/popover';
    import { page } from '$app/stores';

    export let activeSubscriptionType: SubscriptionType;

    function switchTheme() {
        theme.set($theme === Theme.light ? Theme.dark : Theme.light);
    }

    const buttonClass =
        'flex justify-start items-center gap-2 p-2 hover:bg-vLightAccent hover:no-underline w-full';

    let popoverOpen = false;

    // close popover after navigation
    page.subscribe(() => {
        popoverOpen = false;
    });
</script>

<Popover.Root bind:open={popoverOpen}>
    <Popover.Trigger
        class="flex justify-between border-solid items-center gap-1 w-full py-1 hover:bg-lightAccent rounded-full border border-borderColor pl-1 pr-3"
    >
        <AccountCircleOutline size="28" />
        <Streaks condensed />
    </Popover.Trigger>
    <Popover.Content class="p-0 py-2">
        <div class="py-2 px-4">
            <p class="text-sm text-light">logged in as</p>
            <p class="text-lg">{$username || '...'}</p>
        </div>

        <hr />

        <div class="py-2 px-4">
            <Streaks />
        </div>

        <hr />

        <button on:click={switchTheme} class={buttonClass}>
            {#if $theme === Theme.light}
                <DarkTheme size="30" />
                Dark Mode
            {:else}
                <LightTheme size="30" />
                Light Mode
            {/if}
        </button>

        <a aria-label="manage subscription" href="/subscription/manage" class={buttonClass}>
            <PlusThick size="30" />
            {#if activeSubscriptionType === SubscriptionType.Plus}
                Manage EW Plus
            {:else}
                Upgrade to Plus
            {/if}
        </a>

        <a aria-label="settings" href="/settings" class={buttonClass}>
            <CogOutline size="30" />
            Settings
        </a>

        <button aria-label="log out" class={buttonClass} on:click={() => void Auth.logOut()}>
            <Logout size="30" />
            Sign Out
        </button>
    </Popover.Content>
</Popover.Root>
