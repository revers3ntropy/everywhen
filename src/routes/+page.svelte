<script lang="ts">
    import ArrowRightThinCircleOutline from 'svelte-material-icons/ArrowRightThinCircleOutline.svelte';
</script>

<main class="flex-center" style="">
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
    }

    h1 {
        font-size: 3rem;
        margin: 0;

        .beta {
            font-size: 1.2rem;
            color: #aaa;
            vertical-align: text-top;
            font-weight: bold;
            margin-left: -10px;
        }
    }

    p {
        letter-spacing: 1px;
        margin: 1rem 0;
    }

    a.primary {
        font-size: 1.1rem;
        padding: 0.5rem;
        font-weight: 500;
        letter-spacing: 0.5px;
        &:hover {
            text-decoration: none;
        }
    }
</style>
