<script lang="ts">
    import ArrowRightThinCircleOutline from 'svelte-material-icons/ArrowRightThinCircleOutline.svelte';
</script>

<main class="flex-center" style="">
    <div>
        <h1> Halcyon.Land </h1>
        <p> YOUR JOURNAL AND LIFE LOG </p>

        <a href="./login" class="primary with-icon">
            Go to App <ArrowRightThinCircleOutline size="20" />
        </a>
    </div>
</main>

<style>
    main {
        width: 100vw;
        height: 100vh;
    }

    h1 {
        font-size: 3rem;
        margin: 0;
    }

    p {
        letter-spacing: 1px;
        margin: 1rem 0;
    }

    a.primary {
        font-size: 1.2rem;
        padding: 0.5rem;
    }
</style>
