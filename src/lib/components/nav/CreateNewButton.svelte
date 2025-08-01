<script lang="ts">
    import MapMarkerRadiusOutline from 'svelte-material-icons/MapMarkerRadiusOutline.svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import Pencil from 'svelte-material-icons/Pencil.svelte';
    import Moon from 'svelte-material-icons/MoonWaningCrescent.svelte';
    import Lightbulb from 'svelte-material-icons/Lightbulb.svelte';
    import Brain from 'svelte-material-icons/Brain.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { enabledLocation } from '$lib/stores';
    import { notify } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import { page } from '$app/stores';
    import { Entry } from '$lib/controllers/entry/entry';
    import { buttonVariants } from '$lib/components/ui/button';
    import { tryEncryptText } from '$lib/utils/encryption.client';
    import { goto } from '$app/navigation';
    import { eventsSortKey, username } from '$lib/stores';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import { Event as EventController } from '$lib/controllers/event/event';
    import { cn } from '$lib/utils';
    import * as Popover from '$lib/components/ui/popover';
    import { getLocation, nullLocation } from '$lib/utils/geolocation';

    const iconSize = 25;

    async function makeLabelFromNameIfDoesntExist(
        name: string,
        defaultColor: string
    ): Promise<string> {
        const nameEncrypted = tryEncryptText(name);
        const { labels } = notify.onErr(await api.get('/labels'));
        const label = labels.find(label => label.name === nameEncrypted);
        if (label) return label.id;

        const res = notify.onErr(
            await api.post('/labels', {
                name: nameEncrypted,
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
            key: 'useBulletEntryForm',
            value: false
        });
        const labelId = await makeLabelFromNameIfDoesntExist(name, defaultColor);
        localStorage.setItem(Entry.labelLsKey($username, null), labelId);
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
            key: 'useBulletEntryForm',
            value: false
        });
        localStorage.removeItem(Entry.labelLsKey($username, null));
        await gotoIfNotAt('/journal');
    }

    async function makeEvent() {
        // put the new event at the top of the list
        eventsSortKey.set('created');

        const now = nowUtc();
        notify.onErr(
            await api.post('/events', {
                name: EventController.NEW_EVENT_NAME,
                start: now,
                end: now,
                tzOffset: currentTzOffset()
            })
        );

        await gotoIfNotAt('/events');
    }

    async function createLocation() {
        const currentLocation = $enabledLocation ? await getLocation() : nullLocation();
        const { id } = notify.onErr(
            await api.post('/locations', {
                latitude: currentLocation[0] ?? 0,
                longitude: currentLocation[1] ?? 0,
                radius: 0.1,
                name: 'New Location'
            })
        );
        await goto(`/map/${id}`);
    }

    const buttonClass = 'flex justify-start items-center gap-2 p-2 hover:bg-vLightAccent w-full';
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

<Popover.Root>
    <Popover.Trigger class={cn(buttonVariants({ variant: 'outline' }), 'rounded-full h-full')}>
        <Plus size="25" />
        <span class="hide-mobile block"> New </span>
    </Popover.Trigger>
    <Popover.Content class="py-2 px-0">
        <button class="{buttonClass} record-entry" on:click={makeEntry}>
            <Pencil size={iconSize} />
            Record Entry
        </button>

        <button class="{buttonClass} record-dream" on:click={makeDream}>
            <Moon size={iconSize} />
            Record Dream
        </button>

        <button class="{buttonClass} record-idea" on:click={makeIdea}>
            <Lightbulb size={iconSize} />
            Record Idea
        </button>

        <button class="{buttonClass} record-thought" on:click={makeThought}>
            <Brain size={iconSize} />
            Record Thought
        </button>

        <button class="{buttonClass} new-event" on:click={makeEvent}>
            <Calendar size={iconSize} />
            New Event
        </button>

        <button class="{buttonClass} new-event" on:click={createLocation}>
            <MapMarkerRadiusOutline size={iconSize} />
            New Location
        </button>
    </Popover.Content>
</Popover.Root>

<style lang="scss">
    // https://codepen.io/thebabydino/pen/WNVPdJg
    @property --angle {
        syntax: '<angle>';
        initial-value: 0deg;
        inherits: false;
    }

    .create-button:hover::before {
        position: absolute;
        inset: -1px;
        border: solid 3px;
        border-radius: 9999px;
        border-image: conic-gradient(
                from var(--angle),
                #7d9902,
                #63cc78,
                #1db569,
                #09c693,
                #158dcd,
                #5c0099,
                #eb04c9,
                #ff0000,
                #ff6600,
                #ff9900,
                #ffcc00
            )
            1;
        filter: blur(5px);
        animation: a 5s linear infinite;
        content: '';
    }

    @keyframes a {
        from {
            --angle: 0turn;
        }
        to {
            --angle: 1turn;
        }
    }

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
