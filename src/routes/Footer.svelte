<script>
    import Github from 'svelte-material-icons/Github.svelte';

    const version = __VERSION__;
</script>

<footer>
    <div>
        v{version}
    </div>
    <div>
        <a
            aria-label="Github"
            href="https://github.com/revers3ntropy/halcyon.land"
            rel="noreferrer"
            target="_blank"
        >
            <Github size="30" />
        </a>
    </div>
</footer>

<style lang="less">
    @import '../styles/variables';
    @import '../styles/layout.less';

    footer {
        background-color: @header-bg;
        height: 200px;
        display: grid;
        grid-template-columns: 100%;

        div {
            .flex-center();
        }
    }
</style>