<script lang="ts">
    import type { PageData } from './$types';
    import { browser } from '$app/environment';
    import { navigating } from '$app/stores';
    import { onMount } from 'svelte';
    import '../app.scss';
    import Notifications from '$lib/components/notifications/Notifications.svelte';
    import { POLL_FOR_UPDATE_INTERVAL, Theme } from '$lib/constants';
    import { pageInView, populateCookieWritablesWithCookies, theme } from '$lib/stores';
    import { notify } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import Footer from '$lib/components/Footer.svelte';
    import { Result } from '$lib/utils/result';

    export let data: PageData;

    // Fill the stores with the data from the server, while server side
    // and client side.
    // This means that the stores will be populated the whole time,
    // e.g. the theme will be loaded server side so no flash of light
    populateCookieWritablesWithCookies(data.__cookieWritables, data.settings);

    async function checkForUpdate() {
        if (isNewVersionAvailable) return;
        // only check for updates if the user is actually on this tab
        if (document.visibilityState !== 'visible') return;

        const currentVersion = __VERSION__;
        const newVersion = notify.onErr(await api.get('/version')).v;
        if (newVersion !== currentVersion) {
            if (isNewVersionAvailable) return;
            isNewVersionAvailable = true;
            notify.info(`New version (${newVersion}) available, reloading...`);
            location.reload();
        }
    }

    function checkRedactedFontIsLoaded() {
        if (document && document.fonts) {
            if (document.fonts.check('16px "Redacted Script"')) {
                // Make font using elements visible
                root.classList.add('redacted-font-loaded');
                return;
            }
            // Do not block page loading
            setTimeout(() => {
                void document.fonts.load('16px "Redacted Script"').then(() => {
                    // Make font using elements visible
                    root.classList.add('redacted-font-loaded');
                });
            }, 0);
            return;
        }
        // Fallback if API does not exist
        root.classList.add('redacted-font-loaded');
    }

    onMount(() => {
        pageInView.set(document.visibilityState === 'visible');

        setInterval(() => {
            void checkForUpdate();
        }, POLL_FOR_UPDATE_INTERVAL);

        document.addEventListener('visibilitychange', () => {
            pageInView.set(document.visibilityState === 'visible');
            void checkForUpdate();
        });
        checkRedactedFontIsLoaded();
    });

    let isNewVersionAvailable = false;
    let root: HTMLDivElement;

    if (browser) {
        navigating.subscribe(navigating => {
            if (!navigating) return;
            // when the page changes, scroll to the top
            if (root) {
                root.scrollTop = 0;
            }
        });
    }
</script>

<noscript>
    <style>
        .root {
            display: none;
        }
    </style>
    <div>
        <h1>Enable JavaScript</h1>
        <p>
            Everywhen requires JavaScript to be enabled to function. Please enable JavaScript and
            refresh the page.
        </p>
    </div>
</noscript>

<div
    data-sveltekit-preload-data="hover"
    data-theme={browser
        ? $theme
        : Result.tryJsonParse(data.__cookieWritables?.theme).or(Theme.light)}
    class="root h-screen bg-backgroundColor overflow-y-auto overflow-x-hidden"
    bind:this={root}
>
    <svg class="accent-gradient-svg" height={0} width={0}>
        <linearGradient id="accent-gradient" x1={1} x2={1} y1={0} y2={1}>
            <stop offset={0} stop-color="var(--foreground)" />
            <stop offset={1} stop-color="var(--primary)" />
        </linearGradient>
    </svg>

    <Notifications />

    <slot />

    <Footer />
</div>
