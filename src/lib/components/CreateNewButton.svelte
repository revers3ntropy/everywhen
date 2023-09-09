<script lang="ts">
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import BulletPoints from 'svelte-material-icons/FormatListBulleted.svelte';
    import Pencil from 'svelte-material-icons/Pencil.svelte';
    import Moon from 'svelte-material-icons/MoonWaningCrescent.svelte';
    import Lightbulb from 'svelte-material-icons/Lightbulb.svelte';
    import Brain from 'svelte-material-icons/Brain.svelte';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { notify } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { LS_KEYS } from '$lib/constants';
    import { eventsSortKey, settingsStore } from '$lib/stores';
    import { nowUtc } from '$lib/utils/time';
    import { Event as EventController } from '$lib/controllers/event/event';

    async function makeLabelFromNameIfDoesntExist(
        name: string,
        defaultColor: string
    ): Promise<string> {
        const { labels } = notify.onErr(await api.get('/labels'));
        const label = labels.find(label => label.name === name);
        if (label) {
            return label.id;
        }
        const res = notify.onErr(
            await api.post('/labels', {
                name,
                color: defaultColor
            })
        );
        return res.id;
    }

    async function gotoIfNotAt(path: string) {
        if ($page.url.pathname === path) {
            location.reload();
        } else {
            await goto(path);
        }
    }

    async function goToEntryFormWithLabel(name: string, defaultColor: string) {
        await api.put('/settings', {
            key: 'entryFormMode',
            value: false
        });
        const labelId = await makeLabelFromNameIfDoesntExist(name, defaultColor);
        localStorage.setItem(LS_KEYS.newEntryLabel, labelId);
        await gotoIfNotAt('/journal');
    }

    async function makeDream() {
        await goToEntryFormWithLabel('Dream', '#7730ce');
    }

    async function makeIdea() {
        await goToEntryFormWithLabel('Idea', '#ffff65');
    }

    async function makeThought() {
        await goToEntryFormWithLabel('Thought', '#735820');
    }

    async function makeEntry() {
        await api.put('/settings', {
            key: 'entryFormMode',
            value: false
        });
        $settingsStore.entryFormMode.value = false;
        localStorage.removeItem(LS_KEYS.newEntryLabel);
        await gotoIfNotAt('/journal');
    }

    async function makeBullet() {
        await api.put('/settings', {
            key: 'entryFormMode',
            value: true
        });
        $settingsStore.entryFormMode.value = true;
        if ($page.url.pathname !== '/journal') {
            await goto('/journal');
        } else {
            location.reload();
        }
    }

    async function makeEvent() {
        // put the new event at the top of the list
        eventsSortKey.set('created');

        const now = nowUtc();
        notify.onErr(
            await api.post('/events', {
                name: EventController.NEW_EVENT_NAME,
                start: now,
                end: now
            })
        );

        await gotoIfNotAt('/events');
    }
</script>

<svg class="accent-gradient-svg" height={0} width={0}>
    <linearGradient id="dream-gradient" x1={1} x2={1} y1={0} y2={1}>
        <stop offset={0} stop-color="rgb(252,233,255)" />
        <stop offset={1} stop-color="rgb(196,197,255)" />
    </linearGradient>
</svg>
<svg class="accent-gradient-svg" height={0} width={0}>
    <linearGradient id="idea-gradient" x1={1} x2={1} y1={0} y2={1}>
        <stop offset={0} stop-color="white" />
        <stop offset={1} stop-color="yellow" />
    </linearGradient>
</svg>
<svg class="accent-gradient-svg" height={0} width={0}>
    <linearGradient id="thought-gradient" x1={1} x2={1} y1={0} y2={1}>
        <stop offset={0} stop-color="rgb(155,208,198)" />
        <stop offset={1} stop-color="rgb(213,231,227)" />
    </linearGradient>
</svg>
<Dropdown openOnHover width="170px">
    <div class="with-icon w-full" slot="button">
        <Plus size="25" />
        New
    </div>

    <div class="record-something-buttons">
        <button class="with-icon oneline record-entry" on:click={makeEntry}>
            <Pencil size="30" />
            Record Entry
        </button>
        <button class="with-icon oneline record-bullet" on:click={makeBullet}>
            <BulletPoints size="30" />
            Record Bullet
        </button>

        <button class="with-icon oneline record-dream" on:click={makeDream}>
            <Moon size="30" />
            Record Dream
        </button>

        <button class="with-icon oneline record-idea" on:click={makeIdea}>
            <Lightbulb size="30" />
            Record Idea
        </button>

        <button class="with-icon oneline record-thought" on:click={makeThought}>
            <Brain size="30" />
            Record Thought
        </button>

        <button class="with-icon oneline new-event" on:click={makeEvent}>
            <Calendar size="30" />
            New Event
        </button>
    </div>
</Dropdown>

<style lang="scss">
    .record-something-buttons {
        display: block;
        padding: 0.8rem 0 0.8rem 0;

        button {
            width: 100%;
            padding: 0.4em 0.8em 0.4em 0.4em;
            margin: 0;
            border-radius: 0;
            text-align: left;
            color: var(--text-color);
            transition: #{$transition};
        }

        .record-entry:hover {
            background: var(--v-light-accent);

            :global(svg),
            :global(svg *) {
                fill: url(#accent-gradient);
            }
        }

        .record-bullet:hover {
            background: var(--v-light-accent);

            :global(svg),
            :global(svg *) {
                fill: url(#accent-gradient);
            }
        }

        .record-dream:hover {
            background: rgba(0, 0, 255, 0.1);

            :global(svg),
            :global(svg *) {
                fill: url(#dream-gradient);
            }
        }

        .record-idea:hover {
            background: rgba(255, 255, 0, 0.1);

            :global(svg),
            :global(svg *) {
                fill: url(#idea-gradient);
            }
        }

        .record-thought:hover {
            background: rgba(170, 212, 205, 0.1);

            :global(svg),
            :global(svg *) {
                fill: url(#thought-gradient);
            }
        }

        .new-event:hover {
            background: var(--v-light-accent);
        }
    }
</style>
