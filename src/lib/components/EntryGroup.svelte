<script lang="ts">
    import { ANIMATION_DURATION } from '$lib/constants';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import Entry from '$lib/components/Entry.svelte';
    import type { Entry as EntryController } from '$lib/controllers/entry';
    import type { Auth } from '../controllers/user';
    import { nowUtc, utcEq } from '../utils/time';
    import Dot from './Dot.svelte';
    import UtcTime from './UtcTime.svelte';
    import { fly, slide } from 'svelte/transition';

    export let obfuscated = true;
    export let entries: EntryController[];
    export let showLabels = true;
    export let showLocations = true;
    export let hideAgentWidget = false;
    export let auth: Auth;
    export let day: number;

    let collapsed = false;

    function toggleCollapse() {
        collapsed = !collapsed;
    }
</script>

<div class="entry-group container">
    <div class="title">
        <div>
            <h3>
                <button class="flex-center" on:click={toggleCollapse}>
                    {#if collapsed}
                        <ChevronDown size="25" />
                    {:else}
                        <ChevronUp size="25" />
                    {/if}

                    <UtcTime
                        fmt="ddd, Do MMMM YYYY"
                        noTooltip
                        timestamp={day}
                    />

                    <Dot light marginX={10} />

                    <span class="text-light">
                        {#if utcEq(nowUtc(), day)}
                            <span>Today</span>
                        {:else if utcEq(nowUtc() - 60 * 60 * 24, day)}
                            <span>Yesterday</span>
                        {:else}
                            <UtcTime relative timestamp={day} />
                        {/if}
                    </span>

                    {#if collapsed}
                        <div
                            transition:fly|local={{
                                x: -50,
                                duration: ANIMATION_DURATION
                            }}
                            class="flex-center"
                        >
                            <Dot light marginX={10} />
                            <p class="entry-count">
                                {entries.length}
                                {entries.length === 1 ? 'entry' : 'entries'}
                            </p>
                        </div>
                    {/if}
                </button>
            </h3>
        </div>
    </div>
    {#if !collapsed}
        <div
            class="contents"
            transition:slide|local={{
                axis: 'y',
                duration: ANIMATION_DURATION
            }}
        >
            {#each entries as entry}
                <Entry
                    {...entry}
                    on:updated
                    {obfuscated}
                    {showLabels}
                    {showLocations}
                    {hideAgentWidget}
                    {auth}
                />
            {/each}
        </div>
    {/if}
</div>

<style lang="less">
    @import '../../styles/variables';

    .entry-group {
        margin: 1em 0;
        padding: 0.5rem 0;

        transition: height @transition;

        .title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.4rem 0.8rem;

            @media @mobile {
                border-radius: @border-radius;
                background: @light-v-accent;
                border: 1px solid @border;
                margin: 0.5rem 0;
                padding: 0.4rem 0.8rem 0.4rem 0;
                position: sticky;
                top: 0.3em;
                z-index: 4;
            }

            .entry-count {
                font-size: 1rem;

                &,
                & * {
                    color: @text-color-light;
                }

                @media @mobile {
                    display: none;
                }
            }

            h3 {
                font-weight: normal;
            }
        }

        @media @mobile {
            margin: 0;
            border: none;
            border-radius: 0;
        }

        .contents {
            padding: 0 0 1em 0;
        }
    }
</style>
