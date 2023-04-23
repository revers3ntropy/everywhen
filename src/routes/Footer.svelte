<script>
    import Github from 'svelte-material-icons/Github.svelte';
    import OpenInNew from 'svelte-material-icons/OpenInNew.svelte';

    const version = __VERSION__;
</script>

<footer>
    <div class="links-on-line">
        <a aria-label="about" href="/about"> About </a>
        <a aria-label="version history" href="/about/history">
            v{version}
        </a>
        <a
            aria-label="Report Bugs and Request Features"
            href="https://github.com/revers3ntropy/halcyon.land/issues"
            rel="noreferrer"
            target="_blank"
        >
            Report Bugs / Request Features
            <OpenInNew size="15" />
        </a>
    </div>
    <div>
        <a
            aria-label="Github"
            class="gh-link"
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

        .links-on-line {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            align-items: center;

            @media @mobile {
                grid-template-columns: 1fr;
                grid-template-rows: 1fr 1fr 1fr;
            }
        }
    }

    a {
        text-align: center;

        &.gh-link {
            &,
            :global(svg),
            :global(svg *) {
                transition: @transition;
            }

            &:hover {
                :global(svg),
                :global(svg *) {
                    fill: @accent-color-secondary;
                }
            }
        }
    }
</style>
