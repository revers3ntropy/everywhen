<script lang="ts">
    import ArrowRightThinCircleOutline from 'svelte-material-icons/ArrowRight.svelte';
    import EmoticonOutline from 'svelte-material-icons/EmoticonOutline.svelte';
    import Poll from 'svelte-material-icons/Poll.svelte';
    import LockOutline from 'svelte-material-icons/LockOutline.svelte';
    import AccountGroup from 'svelte-material-icons/AccountGroup.svelte';
    import ChartGantt from 'svelte-material-icons/ChartGantt.svelte';
    import MapOutline from 'svelte-material-icons/MapOutline.svelte';
    import InfoOutline from 'svelte-material-icons/InformationOutline.svelte';
    import type { PageData } from './$types';
    import * as Popover from '$lib/components/ui/popover';
    import Logo from '$lib/components/ui/Logo.svelte';
    import { Button } from '$lib/components/ui/button';

    export let data: PageData & { entryCount: number; wordCount: number };
</script>

<svelte:head>
    <title>Everywhen</title>
    <meta name="description" content="Your private journal for every place, time, and story" />
</svelte:head>

<main class="w-screen flex justify-center">
    <div class="pt-20 p-2 md:pt-8">
        <div class="flex flex-col md:flex-center gap-4 flex-wrap">
            <div class="flex-center">
                <Logo scale={0.3} />
            </div>
            <div class="flex flex-col items-center">
                <!-- specific font size so that the title is same width as tagline -->
                <h1 class="title-font text-[50px] md:text-[86px] pb-0"> Everywhen </h1>
                <p class="pb-6 tracking-[1.2px] title-font">
                    Your private journal for every place, time, and story
                </p>
                <a href="/login" class="hover:no-underline">
                    <Button class="w-full flex-center gap-2 rounded-full">
                        Start Writing <ArrowRightThinCircleOutline size="20" />
                    </Button>
                </a>
            </div>
        </div>

        <div class="pt-14">
            <div class="border-t border-border pt-8 pb-14">
                <div class="flex-center p-2">
                    <span class="border border-borderLight rounded-full p-2">
                        <AccountGroup size="40" />
                    </span>
                </div>
                <p class="title-font text-2xl">Trusted</p>
                <div class="flex items-center gap-2">
                    <p class="text-light">
                        Everywhen users trust us with their <b>
                            {data.entryCount?.toLocaleString()}
                        </b>
                        entries, which contain
                        <b>{data.wordCount?.toLocaleString()}</b> words
                    </p>
                    <Popover.Root>
                        <Popover.Trigger
                            class="p-1 bg-vLightAccent hover:bg-lightAccent h-8 w-8 rounded-full flex-center"
                        >
                            <InfoOutline size="20" />
                        </Popover.Trigger>
                        <Popover.Content>
                            Everywhen counts, encrypts and stores the words in your entry when you
                            submit it, to give you analytics while maintaining security.
                        </Popover.Content>
                    </Popover.Root>
                </div>
            </div>
            <div class="border-t border-border pt-8 pb-14">
                <div class="flex-center p-2">
                    <span class="border border-borderLight rounded-full p-2">
                        <ChartGantt size="40" />
                    </span>
                </div>
                <p class="title-font text-2xl">Timeline</p>
                <p class="text-light"> View your entries and events on a timeline </p>
            </div>
            <div class="border-t border-border pt-8 pb-14">
                <div class="flex-center p-2">
                    <span class="border border-borderLight rounded-full p-2">
                        <MapOutline size="40" />
                    </span>
                </div>
                <p class="title-font text-2xl">Map</p>
                <p class="text-light">
                    View your entries on a map and give names to meaningful locations
                </p>
            </div>
            <div class="border-t border-border pt-8 pb-14">
                <div class="flex-center p-2">
                    <span class="border border-borderLight rounded-full p-2">
                        <LockOutline size="40" />
                    </span>
                </div>
                <p class="title-font text-2xl">End-to-end Encryption</p>
                <p class="text-light">
                    Every word you write is encrypted, so no-one else can read your journal entries
                </p>
            </div>
            <div class="border-t border-border pt-8 pb-14">
                <div class="flex-center p-2">
                    <span class="border border-borderLight rounded-full p-2">
                        <Poll size="40" />
                    </span>
                </div>
                <p class="title-font text-2xl">Insights</p>
                <p class="text-light">
                    Get powerful insights into your journaling habits and language use over time
                </p>
            </div>
            <div class="border-t border-border pt-8 pb-20">
                <div class="flex-center p-2">
                    <span class="border border-borderLight rounded-full p-2">
                        <EmoticonOutline size="40" />
                    </span>
                </div>
                <p class="title-font text-2xl">Mood Tracking</p>
                <p class="text-light">
                    Log your mood and get insights into your mental health over time
                </p>
            </div>
        </div>

        <div class="pb-16 flex-center px-4">
            <a href="/login" class="hover:no-underline w-fit max-w-full">
                <Button class="w-full flex-center gap-2 rounded-full">
                    Start Writing <ArrowRightThinCircleOutline size="20" />
                </Button>
            </a>
        </div>
    </div>
</main>

<style lang="scss">
    main {
        @media #{$mobile} {
            display: grid;
            text-align: center;
            align-items: start;
            justify-content: center;
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
        }
    }

    a.primary {
        margin: 0;
        font-size: 1.1rem;
        padding: 0.5rem;
        font-weight: 500;
        letter-spacing: 0.5px;
    }
</style>
