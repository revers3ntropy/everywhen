<script lang="ts">
    import AccountCircleOutline from 'svelte-material-icons/AccountCircleOutline.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import LabelMultipleOutline from 'svelte-material-icons/LabelMultipleOutline.svelte';
    import CalendarMultiple from 'svelte-material-icons/CalendarMultiple.svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
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

    export let activeSubscriptionType: SubscriptionType;

    function switchTheme() {
        theme.set($theme === Theme.light ? Theme.dark : Theme.light);
    }

    const buttonClass =
        'flex justify-start items-center gap-2 p-2 hover:bg-vLightAccent hover:no-underline w-full';
</script>

<Popover.Root>
    <Popover.Trigger
        class="flex justify-between border-solid items-center gap-1 w-full py-1 hover:bg-lightAccent rounded-full border border-borderColor px-2"
    >
        <AccountCircleOutline size="32" />
        <Streaks condensed />
        <span class="hide-mobile">
            <ChevronDown />
        </span>
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

        <hr />

        <a aria-label="deleted entries" href="/journal/deleted" class={buttonClass}>
            <Bin size="30" />
            Deleted Entries
        </a>

        <a aria-label="images" href="/assets" class={buttonClass}>
            <ImageArea size="30" />
            Images
        </a>

        <a aria-label="labels" href="/labels" class={buttonClass}>
            <LabelMultipleOutline size="30" />
            Labels
        </a>

        <a aria-label="events" href="/events" class={buttonClass}>
            <CalendarMultiple size="30" />
            Events
        </a>

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
        <button aria-label="log out" class={buttonClass} on:click={() => void Auth.logOut()}>
            <Logout size="30" />
            Sign Out
        </button>
    </Popover.Content>
</Popover.Root>
