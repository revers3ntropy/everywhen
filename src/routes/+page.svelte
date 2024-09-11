<script lang="ts">
    import Logo from '$lib/components/ui/Logo.svelte';
    import ArrowRightThinCircleOutline from 'svelte-material-icons/ArrowRight.svelte';
    import type { PageData } from './$types';

    export let data: PageData & { entryCount: number; wordCount: number };
</script>

<svelte:head>
    <title>Everywhen</title>
    <meta content="Journaling and Life Logging App" name="description" />
</svelte:head>

<main class="w-screen h-screen flex justify-center">
    <div class="pt-20 md:pt-[30vh]">
        <div class="flex-center gap-4 flex-wrap">
            <div class="flex-center">
                <Logo scale={0.28} />
            </div>
            <div>
                <!-- 50px so that the title is same width as tagline -->
                <h1 class="title-font text-left text-[55px] pb-1"> Everywhen </h1>
                <p class="pb-4"> YOUR JOURNAL AND LIFE LOG </p>

                <a href="./login" class="primary flex-center gap-2">
                    Start Writing <ArrowRightThinCircleOutline size="20" />
                </a>
            </div>
        </div>

        <div class="pt-20 flex-center gap-4 flex-wrap p-4">
            <p class="border rounded-full border-borderColor py-2 px-4">
                <b>{data.entryCount}</b> entries recorded
            </p>
            <p class="border rounded-full border-borderColor py-2 px-4">
                <b>{data.wordCount}</b> words written
            </p>
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

    p {
        letter-spacing: 1px;

        @media (max-width: 350px) {
            font-size: 0.9rem;
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
