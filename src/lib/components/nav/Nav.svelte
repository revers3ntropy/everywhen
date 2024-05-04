<script lang="ts">
    import { page } from '$app/stores';
    import AccountDropdown from '$lib/components/nav/AccountDropdown.svelte';
    import CreateNewButton from '$lib/components/nav/CreateNewButton.svelte';
    import { obfuscated, passcodeLastEntered, settingsStore } from '$lib/stores';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Lock from 'svelte-material-icons/Lock.svelte';
    import MapOutline from 'svelte-material-icons/MapOutline.svelte';
    import Notebook from 'svelte-material-icons/NotebookOutline.svelte';

    const buttonCls =
        'w-full inline-flex px-2 py-3 items-center content-center gap-2 flex-col md:flex-row' +
        ' hover:bg-lightAccent text-textColorLight hover:text-textColor hover:no-underline icon-gradient-on-hover';

    function lock() {
        passcodeLastEntered.set(0);
    }
</script>

<!-- z is 6 so that on mobile the nav buttons are not cut off
     by entry group titles, and is above top navbar -->
<nav class="md:fixed top-0 md:left-0 right-0 md:bottom-0 z-[6] md:h-full w-36 md:bg-vLightAccent">
    <div class="md:grid grid-cols-1 grid-rows-3 h-16 md:h-full w-full">
        <div class="pt-2 flex md:block pr-4 pl-[50px] md:pl-0">
            <div class="pb-4 pl-1 w-full">
                <AccountDropdown />
            </div>
            <div class="pb-4 pl-2">
                <CreateNewButton />
            </div>

            <div class="pl-4 flex flex-col gap-3 items-start">
                {#if $settingsStore.passcode.value}
                    <button on:click={lock} class="danger flex-center gap-2" aria-label="Lock">
                        <Lock size="25" />
                        Lock
                    </button>
                {/if}
                <button
                    aria-label={$obfuscated ? 'Show all' : 'Hide all'}
                    on:click={() => obfuscated.set(!$obfuscated)}
                    class="flex-center gap-2"
                >
                    {#if $obfuscated}
                        <Eye size="25" />
                        Show all
                    {:else}
                        <EyeOff size="25" />
                        Hide all
                    {/if}
                </button>
            </div>
        </div>

        <!-- z-[14] as user popup is z-[15] -->
        <div
            class="bg-vLightAccent border-borderColor border-t-2 md:border-none fixed bottom-0 left-0 w-full h-fit z-[14] flex items-center justify-center md:static md:h-full"
        >
            <div class="flex-center w-full overflow-hidden items-center md:flex-col">
                <a
                    href="/journal"
                    aria-label="journal"
                    class={buttonCls}
                    class:bg-primaryLight={$page.url.pathname.startsWith('/journal') &&
                        !$page.url.pathname.startsWith('/journal/deleted')}
                    class:hover:bg-primaryLight={$page.url.pathname.startsWith('/journal') &&
                        !$page.url.pathname.startsWith('/journal/deleted')}
                >
                    <Notebook size="30" />
                    <div class="text-sm md:text-base"> Journal </div>
                </a>
                <a
                    href="/timeline"
                    aria-label="timeline"
                    class={buttonCls}
                    class:bg-primaryLight={$page.url.pathname.startsWith('/timeline')}
                    class:hover:bg-primaryLight={$page.url.pathname.startsWith('/timeline')}
                >
                    <ChartTimeline size="30" />
                    <div class="text-sm md:text-base"> Timeline </div>
                </a>
                <a
                    href="/map"
                    aria-label="map"
                    class={buttonCls}
                    class:bg-primaryLight={$page.url.pathname.startsWith('/map')}
                    class:hover:bg-primaryLight={$page.url.pathname.startsWith('/map')}
                >
                    <MapOutline size="30" />
                    <div class="text-sm md:text-base"> Map </div>
                </a>
                <a
                    href="/stats"
                    class={buttonCls}
                    class:bg-primaryLight={$page.url.pathname.startsWith('/stats')}
                    class:hover:bg-primaryLight={$page.url.pathname.startsWith('/stats')}
                    aria-label="insights"
                >
                    <Counter size="30" />
                    <div class="text-sm md:text-base"> Insights </div>
                </a>
                <a
                    href="/journal/deleted"
                    class={buttonCls}
                    class:bg-primaryLight={$page.url.pathname.startsWith('/journal/deleted')}
                    class:hover:bg-primaryLight={$page.url.pathname.startsWith('/journal/deleted')}
                    aria-label="bin"
                >
                    <DeleteOutline size="30" />
                    <div class="text-sm md:text-base"> Bin </div>
                </a>
            </div>
        </div>

        <div />
    </div>
</nav>
