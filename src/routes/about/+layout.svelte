<main>
    <div>
        <a href="/"> Everywhen </a>
        <div class="content">
            <slot />
        </div>
    </div>
</main>

<style lang="scss">
    main {
        padding: 1rem;
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    a {
        font-size: 1.5em;
        text-decoration: none;
        text-align: left;
    }

    .content {
        margin-top: 3rem;
        max-width: 600px;
        padding-bottom: 200px;
    }
</style>
