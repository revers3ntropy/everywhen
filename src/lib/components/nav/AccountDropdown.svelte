<script lang="ts">
    import { SubscriptionType } from '$lib/controllers/subscription/subscription';
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
    import Streaks from '$lib/components/Streaks.svelte';
    import { theme, username } from '$lib/stores';
    import { Theme } from '$lib/constants';
    import { Auth } from '$lib/controllers/auth/auth';
    import Dropdown from '$lib/components/ui/Dropdown.svelte';

    export let activeSubscriptionType: SubscriptionType;

    function switchTheme() {
        theme.set($theme === Theme.light ? Theme.dark : Theme.light);
    }
</script>

<Dropdown width="200px" containerClass="w-full block" buttonClass="w-full">
    <div
        class="flex justify-between items-center gap-1 w-full py-1 hover:bg-lightAccent rounded-full border border-borderColor px-2"
        slot="button"
    >
        <AccountCircleOutline size="32" />
        <Streaks condensed />
        <span class="hide-mobile">
            <ChevronDown />
        </span>
    </div>

    <div class="p-1">
        <div class="py-2">
            <div class="px-2">
                <p class="text-sm text-light">logged in as</p>
                <p class="text-lg">{$username || '...'}</p>
            </div>
        </div>

        <hr />
        <div class="py-2">
            <Streaks />
        </div>

        <hr />

        <a
            aria-label="manage subscription"
            href="/subscription/manage"
            class="flex justify-start items-center p-2 gap-2"
        >
            <PlusThick size="30" />
            {#if activeSubscriptionType === SubscriptionType.Plus}
                Manage EW Plus
            {:else}
                Upgrade to Plus
            {/if}
        </a>

        <a aria-label="settings" href="/settings" class="flex justify-start items-center p-2 gap-2">
            <CogOutline size="30" />
            Settings
        </a>

        <hr />

        <a
            aria-label="deleted entries"
            href="/journal/deleted"
            class="flex justify-start items-center p-2 gap-2"
        >
            <Bin size="30" />
            Deleted Entries
        </a>

        <a aria-label="images" href="/assets" class="flex justify-start items-center p-2 gap-2">
            <ImageArea size="30" />
            Images
        </a>

        <a aria-label="labels" href="/labels" class="flex justify-start items-center p-2 gap-2">
            <LabelMultipleOutline size="30" />
            Labels
        </a>

        <a aria-label="events" href="/events" class="flex justify-start items-center p-2 gap-2">
            <CalendarMultiple size="30" />
            Events
        </a>

        <hr />

        <button on:click={switchTheme} class="flex justify-start items-center p-2 gap-2">
            {#if $theme === Theme.light}
                <DarkTheme size="30" />
                Dark Mode
            {:else}
                <LightTheme size="30" />
                Light Mode
            {/if}
        </button>
        <button
            aria-label="log out"
            class="flex justify-start items-center p-2 gap-2 danger"
            on:click={() => void Auth.logOut()}
        >
            <Logout size="30" />
            Sign Out
        </button>
    </div>
</Dropdown>

<style lang="scss">
    .account-button {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 0.25rem;
        align-items: center;
        justify-content: flex-start;
        padding: 0.75rem;
        text-align: left;
        background: var(--light-accent);

        @media #{$mobile} {
            padding: 0.5rem;
        }
    }
</style>
