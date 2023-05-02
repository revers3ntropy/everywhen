<script lang="ts">
    import BookSpinner from '$lib/components/BookSpinner.svelte';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/utils/notifications.js';
    import { onMount } from 'svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
    import EntryTitles from '$lib/components/EntryTitles.svelte';
    import { Entry } from '$lib/controllers/entry';
    import { obfuscated } from '$lib/stores.js';
    import {
        currentTzOffset,
        dayUtcFromTimestamp,
        fmtUtc,
        nowUtc
    } from '$lib/utils/time';

    export const { addNotification } = getNotificationsContext();

    const NUMBER_OF_ENTRY_TITLES = 10;

    export let data: App.PageData;

    onMount(() => (document.title = `Home`));

    function entriesYearsAgoToday(entries: Entry[]): Record<string, Entry[]> {
        const res: Record<string, Entry[]> = {};
        const nowDate = fmtUtc(nowUtc(), currentTzOffset(), 'MM-DD');
        const nowYear = fmtUtc(nowUtc(), currentTzOffset(), 'YYYY');

        for (const entry of entries) {
            const entryDate = fmtUtc(
                entry.created,
                entry.createdTZOffset,
                'MM-DD'
            );
            // entries on the same day and month, but not this year
            if (entryDate === nowDate) {
                const entryYear = fmtUtc(
                    entry.created,
                    entry.createdTZOffset,
                    'YYYY'
                );
                if (entryYear !== nowYear) {
                    const yearsAgo = parseInt(nowYear) - parseInt(entryYear);
                    if (!res[yearsAgo]) {
                        res[yearsAgo] = [];
                    }
                    res[yearsAgo].push(entry);
                }
            }
        }
        return res;
    }

    let titles: Entry[];
    let groupedTitles: Record<string, Entry[]>;
    let titlesLoaded = false;

    onMount(async () => {
        const titlesRes = displayNotifOnErr(
            addNotification,
            await api.get(data, '/entries/titles')
        );
        titles = titlesRes.entries;

        const byDay = Entry.groupEntriesByDay(titles);

        let i = 0;
        groupedTitles = Object.keys(byDay)
            .sort((a, b) => parseInt(b) - parseInt(a))
            .reduce((acc, key) => {
                if (i >= NUMBER_OF_ENTRY_TITLES) return acc;
                i += byDay[parseInt(key)].length;
                return {
                    ...acc,
                    [key]: byDay[parseInt(key)]
                } as Record<string, Entry[]>;
            }, {} as Record<string, Entry[]>);
        titlesLoaded = true;
    });
</script>

<main>
    <section>
        <div class="buttons">
            <a class="primary with-icon" href="/journal">
                <Notebook size="25" />
                Journal
            </a>
            <a class="icon-gradient-on-hover with-icon" href="/labels">
                <LabelOutline size="25" />
                Labels
            </a>
            <a class="icon-gradient-on-hover with-icon" href="/events">
                <Calendar size="25" />
                Events
            </a>
            <a class="icon-gradient-on-hover with-icon" href="/assets">
                <ImageOutline size="25" />
                Gallery
            </a>
            <a class="icon-gradient-on-hover with-icon" href="/settings">
                <Cog size="25" />
                Settings
            </a>
        </div>
    </section>
    {#if titlesLoaded}
        {#if Object.keys(groupedTitles || {}).length}
            <section>
                <h1>Recent Entries</h1>
                <EntryTitles
                    auth={data}
                    titles={groupedTitles}
                    obfuscated={$obfuscated}
                    hideAgentWidget={!data.settings.showAgentWidgetOnEntries
                        .value}
                />
            </section>
        {:else}
            <section>
                <h1 class="recent-entries">Recent Entries</h1>
                <p class="recent-entries-text">
                    Doesn't look like you have any entries yet, why not <a
                        href="/journal?obfuscate=0">write one</a
                    >?
                </p>
            </section>
        {/if}
        {#each Object.entries(entriesYearsAgoToday(titles)) as [yearsAgo, entries] (yearsAgo)}
            <section>
                <h1>
                    {yearsAgo === '1' ? `A Year` : `${yearsAgo} Years`} Ago Today
                </h1>
                <EntryTitles
                    titles={{
                        [dayUtcFromTimestamp(
                            entries[0].created,
                            entries[0].createdTZOffset
                        )]: entries
                    }}
                    obfuscated={$obfuscated}
                    showTimeAgo={false}
                    auth={data}
                    hideAgentWidget={!data.settings.showAgentWidgetOnEntries
                        .value}
                />
            </section>
        {/each}
    {:else}
        <BookSpinner />
    {/if}
</main>

<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/layout';

    .buttons {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        @media @mobile {
            flex-direction: column;
        }

        a,
        button {
            padding: 0.5rem;
            margin: 0.2rem 1rem;
            font-size: 1.1rem;
        }
    }

    h1 {
        font-size: 1.5rem;
        // negative on the bottom to put in line with the titles due
        // to the visibility toggle being inline
        margin: 1em 1em -22px 1em;
        padding: 0.5em;
        border-bottom: 1px solid @light-accent;
        text-align: start;

        @media @mobile {
            font-size: 1.2rem;
        }

        &.recent-entries {
            margin: 1rem;
        }
    }

    .recent-entries-text {
        margin: 0.5rem;
    }
</style>
