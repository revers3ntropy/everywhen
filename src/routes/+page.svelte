<script lang="ts">
    import ArrowRightThinCircleOutline from 'svelte-material-icons/ArrowRightThinCircleOutline.svelte';
</script>

<main class="flex-center">
    <div>
        <h1> Halcyon.Land <span class="beta"> beta </span> </h1>
        <p> YOUR JOURNAL AND LIFE LOG </p>

        <a href="./login" class="primary with-icon">
            Start Writing <ArrowRightThinCircleOutline size="20" />
        </a>
    </div>
</main>

<style lang="less">
    main {
        width: 100vw;
        height: 100vh;
        padding: 1rem;
    }

    h1 {
        font-size: 3rem;
        padding: 0;

        @media (max-width: 400px) {
            font-size: 2.5rem;
        }
        @media (max-width: 350px) {
            font-size: 2rem;
        }

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
