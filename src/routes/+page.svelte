<script lang="ts">
    import Logo from '$lib/components/ui/Logo.svelte';
    import ArrowRightThinCircleOutline from 'svelte-material-icons/ArrowRight.svelte';
</script>

<svelte:head>
    <title>Everywhen</title>
    <meta content="Journaling and Life Logging App" name="description" />
</svelte:head>

<main class="flex-center">
    <div class="flex-center">
        <Logo />
    </div>
    <div>
        <h1> <span class="serif">Everywhen</span> <span class="beta"> beta </span> </h1>
        <p> YOUR JOURNAL AND LIFE LOG </p>

        <a href="./login" class="primary with-icon serif">
            Start Writing <ArrowRightThinCircleOutline size="20" />
        </a>
    </div>
</main>

<style lang="scss">
    main {
        width: 100vw;
        height: 100vh;
        padding: 1rem;

        @media #{$mobile} {
            display: grid;
            text-align: center;
            align-items: start;
            justify-content: center;
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
        }
    }

    h1 {
        font-size: 3rem;
        padding: 0;
        margin: 0;

        .beta {
            font-size: 1.2rem;
            color: var(--text-color-light);
            vertical-align: text-top;
            font-weight: bold;
            margin-left: -10px;

            @media (max-width: 400px) {
                font-size: 1rem;
            }
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
