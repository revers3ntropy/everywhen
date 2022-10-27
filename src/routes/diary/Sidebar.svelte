<script lang="ts">
    import Time from "svelte-time";
    import moment from "moment";
    import Close from 'svelte-material-icons/Close.svelte';
    import Menu from 'svelte-material-icons/Menu.svelte';
    import type { Entry } from "$lib/types";

    export let titles: Record<number, Entry[]>;

    let showing = false;
</script>
<div>
    <div class="floating-button">
        <button on:click={() => showing = !showing}>
            <Menu size="40" />
        </button>
    </div>
    <div class="sidebar {showing ? 'showing' : ''}">
        <div class="header">
            <button on:click={() => showing = !showing}>
                <Close size="30" />
            </button>
        </div>
        <div class="content">
            {#each Object.keys(titles) as day}
                <div class="day">
                    <h2>
                        {#if new Date() - new Date(day * 1000) < 8.64e7}
                            Today
                        {:else if new Date() - new Date(day * 1000) < 2 * 8.64e7}
                            Yesterday
                        {:else}
                            <Time relative timestamp={new Date(day * 1000)} />
                        {/if}
                    </h2>

                    {#each titles[day] as entry}
                        <p class="entry">
                            <span class="entry-time">
                                {moment(new Date(entry.created * 1000)).format('h:mm A')}
                            </span>
                            {#if entry.title}
                                {entry.title}
                            {:else}
                                <span class="entry-preview">{entry.entry}...</span>
                            {/if}
                        </p>
                    {/each}
                </div>
            {/each}
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
        &.showing {
            transform: translateX(0);
        }
    }

    .day {
        padding: 0.3rem 0.8em 0.7em 0.2em;
        border-bottom: 2px solid @border-heavy;
        &:last-child {
            border-bottom: none;
        }
        p {
            font-size: 0.90rem;
            margin: 0;
            padding: 0;
        }

        h2 {
            font-size: 1.1rem;
            padding: 0;
            margin: 0.5em 0 0.5em 2em;
        }

        .entry {
            display: grid;
            grid-template-columns: 60px 1fr;
            padding: 2px 0;
            align-items: center;
            .entry-time {
                font-size: 0.7rem;
                color: @text-color-light;
                width: 100%;
                text-align: center;
            }

            .entry-preview {
                color: @text-color-light;
            }
        }
    }

    .header {
        padding: 0.5rem;
        display: flex;
        justify-content: right;
        align-content: center;
    }

</style>