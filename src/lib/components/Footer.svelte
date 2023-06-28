<script>
    import Github from 'svelte-material-icons/Github.svelte';
    import OpenInNew from 'svelte-material-icons/OpenInNew.svelte';
    import DonateWidget from '$lib/components/DonateWidget.svelte';

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
            class="with-icon icon-gradient-on-hover"
            href="https://github.com/revers3ntropy/halcyon.land"
            rel="noreferrer"
            target="_blank"
        >
            <Github size="30" />
            <span> Source Code <OpenInNew size="15" /> </span>
        </a>
    </div>
    <div>
        <DonateWidget />
    </div>
    <div class="spacer" />
</footer>

<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/layout';

    footer {
        background-color: var(--nav-bg);
        display: grid;
        grid-template-columns: 100%;

        padding: 5rem 0 5rem 0;
        border-top: 1px solid var(--border-color);

        div {
            margin: 1rem;
            .flex-center();
        }

        .links-on-line {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            align-items: center;

            @media @mobile {
                grid-template-columns: 1fr;
                grid-template-rows: 1fr 1fr 1fr;
                gap: 1rem;
                margin: 0 0 1rem 0;
            }
        }

        @media @mobile {
            margin-bottom: 10rem;
        }
    }

    a {
        text-align: center;
    }
</style>
