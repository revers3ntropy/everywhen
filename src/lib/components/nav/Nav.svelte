<script lang="ts">
    import ChartLine from 'svelte-material-icons/ChartLine.svelte';
    import ChartTimeline from 'svelte-material-icons/ChartTimeline.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Lock from 'svelte-material-icons/Lock.svelte';
    import MapOutline from 'svelte-material-icons/MapOutline.svelte';
    import Notebook from 'svelte-material-icons/NotebookOutline.svelte';
    import Search from 'svelte-material-icons/Magnify.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import { page } from '$app/stores';
    import SearchPage from '$lib/components/SearchPage.svelte';
    import Bin from 'svelte-material-icons/DeleteOutline.svelte';
    import LabelMultipleOutline from 'svelte-material-icons/LabelMultipleOutline.svelte';
    import CalendarMultiple from 'svelte-material-icons/CalendarMultiple.svelte';
    import FolderMultipleImage from 'svelte-material-icons/FolderMultipleImage.svelte';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Popover from '$lib/components/ui/popover';
    import AccountDropdown from '$lib/components/nav/AccountDropdown.svelte';
    import { Button, buttonVariants } from '$lib/components/ui/button';
    import type { Label } from '$lib/controllers/label/label';
    import type { Location } from '$lib/controllers/location/location';
    import type { SubscriptionType } from '$lib/controllers/subscription/subscription';
    import { obfuscated, passcodeLastEntered, settingsStore } from '$lib/stores';
    import { cn } from '$lib/utils';
    import CogOutline from 'svelte-material-icons/CogOutline.svelte';

    export let locations: Location[];
    export let labels: Record<string, Label>;
    export let activeSubscriptionType: SubscriptionType;

    function buttonCls(onPage: boolean) {
        return cn(
            'rounded-xl md:rounded-l-none w-full inline-flex px-2 py-3 items-center content-center gap-1 flex-col text-sm title-font',
            'hover:bg-lightAccent text-textColorLight hover:text-textColor hover:no-underline icon-gradient-on-hover',
            // make button look disabled if already on the page
            onPage ? 'font-bold bg-secondary hover:bg-secondary' : ''
        );
    }
    function lock() {
        passcodeLastEntered.set(0);
        obfuscated.set(true);
    }

    let morePopoverOpen = false;

    page.subscribe(() => (morePopoverOpen = false));
</script>

<!-- z is 6 so that on mobile the nav buttons are not cut off
     by entry group titles, and is above top navbar -->
<nav class="md:bg-vLightAccent w-full h-full z-[6] md:shadow-lg">
    <div class="md:grid grid-cols-1 grid-rows-3 h-16 md:h-full w-full">
        <div class="pt-1 md:pt-2 px-1 flex md:block">
            <div class="md:pb-2 w-full">
                <AccountDropdown {activeSubscriptionType} />
            </div>
            <div class="pl-1 md:pl-0 md:pb-2 flex gap-1 md:flex-col">
                <span>
                    <Dialog.Root>
                        <Dialog.Trigger
                            aria-label="Search"
                            class={cn(
                                buttonVariants({ variant: 'outline' }),
                                'flex-center gap-2 rounded-full px-2 py-5 aspect-square md:px-4 w-full'
                            )}
                        >
                            <Search size="20" />
                        </Dialog.Trigger>
                        <Dialog.Content>
                            <div class="h-[90vh] overflow-y-auto overflow-x-hidden">
                                <SearchPage {locations} {labels} />
                            </div>
                        </Dialog.Content>
                    </Dialog.Root>
                </span>
                <span>
                    <Button
                        aria-label={$obfuscated ? 'Show all' : 'Hide all'}
                        on:click={() => obfuscated.set(!$obfuscated)}
                        class="flex-center rounded-full px-2 py-5 aspect-square w-full"
                        variant="outline"
                    >
                        {#if $obfuscated}
                            <Eye size="20" />
                        {:else}
                            <EyeOff size="20" />
                        {/if}
                    </Button>
                </span>
                <span class="only-mobile">
                    {#if $settingsStore.passcode.value}
                        <Button
                            variant="outline"
                            on:click={lock}
                            class="flex-center rounded-full px-2 py-5 aspect-square md:gap-2 md:w-full"
                            aria-label="Lock"
                        >
                            <Lock size="20" />
                        </Button>
                    {/if}
                </span>
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
                    class={buttonCls($page.url.pathname.startsWith('/journal'))}
                >
                    <Notebook size="30" />
                    <div> Journal </div>
                </a>
                <a
                    href="/map"
                    aria-label="map"
                    class={buttonCls($page.url.pathname.startsWith('/map'))}
                >
                    <MapOutline size="30" />
                    <div> Map </div>
                </a>
                <a
                    href="/stats"
                    class={buttonCls($page.url.pathname.startsWith('/stats'))}
                    aria-label="insights"
                >
                    <Counter size="30" />
                    <div> Insights </div>
                </a>
                <a
                    aria-label="strands"
                    href="/datasets"
                    class={buttonCls($page.url.pathname.startsWith('/datasets'))}
                >
                    <ChartLine size="30" />
                    <div> Strands </div>
                </a>

                <Popover.Root bind:open={morePopoverOpen}>
                    <Popover.Trigger
                        aria-label="more pages"
                        class={buttonCls(
                            $page.url.pathname.startsWith('/settings') ||
                                $page.url.pathname.startsWith('/journal/deleted') ||
                                $page.url.pathname.startsWith('/labels') ||
                                $page.url.pathname.startsWith('/events') ||
                                $page.url.pathname.startsWith('/timeline') ||
                                $page.url.pathname.startsWith('/assets')
                        )}
                    >
                        <ChevronDown size="30" />
                        <span>More...</span>
                    </Popover.Trigger>
                    <Popover.Content class="p-0 overflow-hidden w-32">
                        <a
                            aria-label="settings"
                            href="/settings"
                            class={cn(
                                buttonCls($page.url.pathname.startsWith('/settings')),
                                'bg-lightAccent hover:bg-vLightAccent'
                            )}
                        >
                            <CogOutline size="30" />
                            Settings
                        </a>
                        <a
                            aria-label="deleted entries"
                            href="/journal/deleted"
                            class={cn(
                                buttonCls($page.url.pathname.startsWith('/journal/deleted')),
                                'bg-lightAccent hover:bg-vLightAccent'
                            )}
                        >
                            <Bin size="30" />
                            Deleted Entries
                        </a>
                        <a
                            aria-label="images"
                            href="/assets"
                            class={cn(
                                buttonCls($page.url.pathname.startsWith('/assets')),
                                'bg-lightAccent hover:bg-vLightAccent'
                            )}
                        >
                            <FolderMultipleImage size="30" />
                            Media
                        </a>
                        <a
                            aria-label="labels"
                            href="/labels"
                            class={cn(
                                buttonCls($page.url.pathname.startsWith('/labels')),
                                'bg-lightAccent hover:bg-vLightAccent'
                            )}
                        >
                            <LabelMultipleOutline size="30" />
                            Labels
                        </a>
                        <a
                            aria-label="events"
                            href="/events"
                            class={cn(
                                buttonCls($page.url.pathname.startsWith('/events')),
                                'bg-lightAccent hover:bg-vLightAccent'
                            )}
                        >
                            <CalendarMultiple size="30" />
                            Events
                        </a>
                        <a
                            href="/timeline"
                            aria-label="timeline"
                            class={cn(
                                buttonCls($page.url.pathname.startsWith('/timeline')),
                                'bg-lightAccent hover:bg-vLightAccent'
                            )}
                        >
                            <ChartTimeline size="30" />
                            <div> Timeline </div>
                        </a>
                    </Popover.Content>
                </Popover.Root>
            </div>
        </div>

        <div class="flex items-end p-1 hide-mobile">
            {#if $settingsStore.passcode.value}
                <Button
                    variant="outline"
                    on:click={lock}
                    class="flex-center rounded-full px-2 py-5 aspect-square md:gap-2 md:w-full"
                    aria-label="Lock"
                >
                    <Lock size="20" />
                    Lock
                </Button>
            {/if}
        </div>
    </div>
</nav>
