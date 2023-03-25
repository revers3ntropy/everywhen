<script lang="ts">
    import EntryTitles from '$lib/components/EntryTitles.svelte';
    import Close from 'svelte-material-icons/Close.svelte';
    import Menu from 'svelte-material-icons/Menu.svelte';
    import type { Entry } from '../controllers/entry';

    export let titles: Record<number, Entry[]>;

    let showing = false;
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
    <div class="sidebar {showing ? 'showing' : ''}">
        <div class="header">
            <button
                aria-label="Close sidebar menu"
                on:click={() => (showing = !showing)}
            >
                <Close size="30" />
            </button>
        </div>
        <div class="content">
            <EntryTitles {titles} />
        </div>
    </div>
</div>

<style lang="less">
    @import '../../styles/variables.less';

    @width: 300px;

    .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        min-width: @width;
        max-width: max(30%, @width);
        height: 100%;
        background-color: @header-bg;
        z-index: 100;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        border-right: 2px solid @border-heavy;
        overflow-y: scroll;
        padding: 0;

        &.showing {
            transform: translateX(0);
        }

        .header {
            padding: 0.5rem;
            display: flex;
            justify-content: right;
            align-content: center;
            position: sticky;
            top: 0;
            background: linear-gradient(180deg, @light-accent, transparent);
        }
    }
</style>
