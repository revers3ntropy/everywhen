<script lang="ts">
    import Close from 'svelte-material-icons/Close.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Menu from 'svelte-material-icons/Menu.svelte';
    import { fly } from 'svelte/transition';
    import { ANIMATION_DURATION } from '../constants';
    import type { Entry } from '../controllers/entry';
    import type { Auth } from '../controllers/user';
    import EntryTitles from './EntryTitles.svelte';

    export let titles: Record<number, Entry[]>;
    export let auth: Auth;
    export let hideAgentWidget: boolean;

    let showing = false;
    let obfuscated = false;
</script>

<div>
    <div class="floating-button">
        <button
            aria-label="Show sidebar menu"
            on:click={() => (showing = !showing)}
        >
            <Menu size="40" />
        </button>
    </div>
    {#if showing}
        <div
            class="sidebar"
            transition:fly={{
                duration: ANIMATION_DURATION,
                x: -200
            }}
        >
            <div class="header">
                <button
                    aria-label={obfuscated ? 'Show entries' : 'Hide entries'}
                    on:click={() => (obfuscated = !obfuscated)}
                >
                    {#if obfuscated}
                        <Eye size="25" />
                    {:else}
                        <EyeOff size="25" />
                    {/if}
                </button>
                <button
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
    {/if}
</div>

<style lang="less">
    @import '../../styles/variables';

    @width: 300px;

    .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        min-width: @width;
        height: 100%;
        background-color: @header-bg;
        z-index: 10;
        border-right: 2px solid @border-heavy;
        overflow-y: scroll;
        padding: 0;

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
