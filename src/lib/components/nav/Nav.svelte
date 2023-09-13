<script lang="ts">
    import ExpandedNav from '$lib/components/nav/ExpandedNav.svelte';
    import ShortNav from '$lib/components/nav/ShortNav.svelte';
    import { navExpanded } from '$lib/stores';
</script>

<nav>
    {#if $navExpanded}
        <ExpandedNav />
    {:else}
        <ShortNav />
    {/if}
</nav>

<style lang="scss">
    $nav-open-width: 12rem;

    nav {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        // increased to 5 so that on mobile the nav buttons are not cut off
        // by entry group titles
        z-index: 5;
        height: 100%;
    }
</style>
