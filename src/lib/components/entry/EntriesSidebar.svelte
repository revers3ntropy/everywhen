<script lang="ts">
    import Close from 'svelte-material-icons/Close.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Menu from 'svelte-material-icons/Menu.svelte';
    import type { Entry } from '$lib/controllers/entry';
    import type { Auth } from '$lib/controllers/user';
    import EntryTitles from './EntryTitles.svelte';

    export let titles: Record<string, Entry[]> | null;
    export let auth: Auth;
    export let obfuscated = false;
    export let hideAgentWidget: boolean;

    let showing = false;
</script>

<div class="floating-button only-mobile">
    <button
        aria-label="Show sidebar menu"
        on:click={() => (showing = !showing)}
    >
        <Menu size="40" />
    </button>
</div>
<div class="sidebar {showing ? 'showing' : ''}">
    <div class="header">
        <button
            class="with-circled-icon"
            aria-label={obfuscated ? 'Show entries' : 'Hide entries'}
            on:click={() => (obfuscated = !obfuscated)}
        >
            {#if obfuscated}
                <Eye size="32" />
            {:else}
                <EyeOff size="32" />
            {/if}
        </button>
        <button
            class="only-mobile"
            aria-label="Close sidebar menu"
            on:click={() => (showing = !showing)}
        >
            <Close size="30" />
        </button>
    </div>
    <div class="content">
        <EntryTitles
            {auth}
            {obfuscated}
            {titles}
            hideBlurToggle
            {hideAgentWidget}
        />
    </div>
</div>

<style lang="less">
    @import '../../../styles/variables';

    .sidebar {
        width: 100%;
        background-color: var(--v-light-accent);
        overflow-y: scroll;
        padding: 0;

        @media @not-mobile {
            position: sticky;
            top: 1rem;
            height: calc(100vh - 2rem);
            // for the scroll bar
            border-radius: @border-radius 0 0 @border-radius;
            background: none;
            border: 1px solid var(--border-color);
        }

        @media @mobile {
            height: 100vh;
            z-index: 10;
            transition: @transition;
            transform: translateX(-100%);
            position: fixed;
            top: 0;
            left: 0;
            margin: 0;

            &.showing {
                transform: translateX(0);
                border-right: 2px solid var(--border-heavy);
            }
        }

        .header {
            padding: 0.5rem;
            display: flex;
            justify-content: right;
            align-content: center;
            position: sticky;
            top: 0;
        }
    }
</style>
