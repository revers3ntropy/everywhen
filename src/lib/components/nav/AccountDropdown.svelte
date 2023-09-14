<script lang="ts">
    import { theme } from '$lib/stores';
    import { Theme } from '$lib/constants';
    import { Auth } from '$lib/controllers/auth/auth';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import LightTheme from 'svelte-material-icons/WhiteBalanceSunny.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import Logout from 'svelte-material-icons/Logout.svelte';
    import Streaks from '$lib/components/Streaks.svelte';
    import CogOutline from 'svelte-material-icons/CogOutline.svelte';
    import DarkTheme from 'svelte-material-icons/WeatherNight.svelte';

    function switchTheme() {
        theme.set($theme === Theme.light ? Theme.dark : Theme.light);
    }
</script>

<Dropdown fromRight width="200px">
    <div
        class="flex justify-end items-center gap-1 bg-vLightAccent w-full p-2 hover:bg-lightAccent rounded-full"
        slot="button"
    >
        <ChevronDown />
        <slot />
        <Streaks condensed />
    </div>

    <div class="account-dropdown-options">
        <Streaks />

        <hr />

        <button class="account-dropdown-button" on:click={switchTheme}>
            {#if $theme === Theme.light}
                <DarkTheme size="30" />
                Dark Mode
            {:else}
                <LightTheme size="30" />
                Light Mode
            {/if}
        </button>

        <a aria-label="settings" class="account-dropdown-button" href="/settings">
            <CogOutline size="30" />
            Settings
        </a>

        <button
            aria-label="log out"
            class="account-dropdown-button danger"
            on:click={() => void Auth.logOut()}
        >
            <Logout size="30" />
            Log Out
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

    .account-dropdown-options {
        padding: 0.5rem 0;

        button,
        a {
            margin: 0;
            padding: 0.4em 0.8em 0.4em 0.4em;
            width: 100%;
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 1rem;
            align-items: center;
            justify-content: flex-start;
            text-align: left;

            &:hover {
                background-color: var(--v-light-accent);
            }
        }

        hr {
            margin: 10px 0;
            border: none;
            border-bottom: 1px solid var(--background-color);
        }
    }
</style>
