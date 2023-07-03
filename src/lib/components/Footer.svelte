<script>
    import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
    import BugOutline from 'svelte-material-icons/BugOutline.svelte';
    import Github from 'svelte-material-icons/Github.svelte';
    import History from 'svelte-material-icons/History.svelte';
    import OpenInNew from 'svelte-material-icons/OpenInNew.svelte';
    import DonateWidget from '$lib/components/DonateWidget.svelte';
    import Logo from '$lib/components/Logo.svelte';

    const version = __VERSION__;
</script>

<footer>
    <div class="logo">
        <Logo scale={1 / 3} />
    </div>
    <div class="info">
        <div>
            <span />
            <a aria-label="about" href="/about" class="with-icon icon-gradient-on-hover">
                <InformationOutline size="30" /> About Halcyon.Land
            </a>
        </div>
        <div>
            <a
                aria-label="version history"
                href="/about/history"
                class="with-icon icon-gradient-on-hover"
            >
                <History size="30" /> v{version} - Version History
            </a>
        </div>
        <div>
            <a
                aria-label="Report Bugs and Request Features"
                href="https://github.com/revers3ntropy/halcyon.land/issues"
                rel="noreferrer"
                target="_blank"
                class="with-icon icon-gradient-on-hover"
            >
                <BugOutline size="30" />
                <span>
                    Report Bugs / Request Features
                    <OpenInNew size="15" />
                </span>
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

        <div> <DonateWidget /> </div>
    </div>
</footer>

<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/layout';

    footer {
        background-color: var(--nav-bg);
        display: grid;
        grid-template-columns: 1fr 1fr;

        padding: 5rem 0 5rem 0;
        border-top: 1px solid var(--border-color);

        @media @mobile {
            margin-bottom: 10rem;
        }

        .logo {
            display: flex;
            align-items: center;
            justify-content: end;
        }

        .info {
            display: block;

            & > * {
                margin: 20px 0;
            }
        }
    }
</style>
