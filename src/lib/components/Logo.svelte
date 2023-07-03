<script lang="ts">
    import { theme } from '$lib/stores.js';
    import { Theme } from '$lib/constants.js';

    export let scale = 1 / 4;
</script>

{#if $theme === Theme.dark}
    <img
        src="/logodark.png"
        alt="Logo"
        height={672 * scale}
        width={459 * scale}
        style="margin-right: 1rem"
    />
{:else}
    <img
        src="/logolight.png"
        alt="Logo"
        height={672 * scale}
        width={459 * scale}
        style="margin-right: 1rem"
    />
{/if}
