<script>
    import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
    import BugOutline from 'svelte-material-icons/BugOutline.svelte';
    import Github from 'svelte-material-icons/Github.svelte';
    import Security from 'svelte-material-icons/Security.svelte';
    import History from 'svelte-material-icons/History.svelte';
    import OpenInNew from 'svelte-material-icons/OpenInNew.svelte';
    import DonateWidget from '$lib/components/DonateWidget.svelte';
    import Logo from '$lib/components/Logo.svelte';
    import { PUBLIC_ENV } from '$env/static/public';

    const version = __VERSION__;
</script>

<footer>
    <div class="split">
        <div class="logo">
            <Logo scale={1 / 3} />
        </div>
        <div class="info">
            <div>
                <a aria-label="about" href="/about" class="with-icon icon-gradient-on-hover">
                    <InformationOutline size="25" /> About Everywhen
                </a>
            </div>
            <div>
                <a
                    aria-label="about"
                    href="/about/privacy"
                    class="with-icon icon-gradient-on-hover"
                >
                    <Security size="25" /> Privacy Policy
                </a>
            </div>
            <div>
                <a
                    aria-label="version history"
                    href="/about/history"
                    class="with-icon icon-gradient-on-hover"
                >
                    <History size="25" /> Version History
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
                    <BugOutline size="25" />
                    <span class="flex-center gap-2">
                        Report Bugs / Request Features <OpenInNew />
                    </span>
                </a>
            </div>
            <div>
                <a
                    aria-label="Github"
                    class="with-icon"
                    href="https://github.com/revers3ntropy/halcyon.land"
                    rel="noreferrer"
                    target="_blank"
                >
                    <Github size="25" />
                    <span class="flex-center gap-2"> Source Code <OpenInNew /> </span>
                </a>
            </div>

            <div> <DonateWidget /> </div>
        </div>
    </div>

    <div class="flex-center text-light pt-4">
        Everywhen v{version}
        {PUBLIC_ENV === 'prod' ? `` : `(${PUBLIC_ENV})`}
    </div>
</footer>

<style lang="scss">
    @import '$lib/styles/layout';

    footer {
        padding: 5rem 0 5rem 0;
        border-top: 1px solid var(--border-color);
    }

    .split {
        background-color: var(--nav-bg);
        display: grid;
        grid-template-columns: 1fr 1fr;

        .logo {
            display: flex;
            align-items: center;
            justify-content: flex-end;
        }

        .info {
            display: block;

            & > * {
                margin: 15px;
            }
        }

        @media #{$mobile} {
            margin-bottom: 10rem;
            grid-template-columns: 1fr;

            .logo,
            .info {
                justify-content: center;
            }
        }
    }
</style>
