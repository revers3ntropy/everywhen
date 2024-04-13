<script lang="ts">
    import Logo from '$lib/components/ui/Logo.svelte';
    import ArrowRightThinCircleOutline from 'svelte-material-icons/ArrowRight.svelte';
</script>

<svelte:head>
    <title>Everywhen</title>
    <meta content="Journaling and Life Logging App" name="description" />
</svelte:head>

<main class="flex-center w-screen h-screen p-4">
    <div class="flex-center">
        <Logo scale={0.28} />
    </div>
    <div>
        <h1 class="serif text-left text-5xl"> Everywhen </h1>
        <p> YOUR JOURNAL AND LIFE LOG </p>

        <a href="./login" class="primary flex-center gap-2 serif">
            Start Writing <ArrowRightThinCircleOutline size="20" />
        </a>
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
        margin: 1rem 0;

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

        &:hover {
            text-decoration: none;
        }
    }
</style>
