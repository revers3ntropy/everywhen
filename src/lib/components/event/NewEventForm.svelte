<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import { Button } from '$lib/components/ui/button';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import { api } from '$lib/utils/apiRequest';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import { type Event } from '$lib/controllers/event/event';
    import type { Label } from '$lib/controllers/label/label';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';

    export let labels: Record<string, Label>;
    export let onSubmit: (event: Event) => void;

    let name = '';
    let labelId: string | undefined = undefined;
    let start = nowUtc();
    let end = nowUtc();

    listen.label.onCreate(label => {
        labels = {
            ...labels,
            [label.id]: label
        };
    });
    listen.label.onUpdate(label => {
        labels = {
            ...labels,
            [label.id]: label
        };
    });
    listen.label.onDelete(id => {
        // TODO check this syntax will actually update Svelte thing
        delete labels[id];
    });

    async function submit() {
        if (!name) return;

        const { id } = notify.onErr(
            await api.post('/events', {
                name,
                label: labelId,
                start,
                end,
                tzOffset: currentTzOffset()
            })
        );

        const event = {
            id,
            name,
            label: labelId ? labels[labelId] : null,
            start,
            end,
            tzOffset: currentTzOffset(),
            created: nowUtc()
        };
        await dispatch.create('event', event);
        onSubmit(event);
    }
</script>

<div>
    <h3 class="pl-2">New Event</h3>
    <div>
        <Textbox bind:value={name} label="Name" ariaLabel="Event Name" />
    </div>
    <div class="py-2">
        <LabelSelect bind:value={labelId} {labels} />
    </div>
    <div class="pl-2">
        <Button on:click={submit} class="mt-4" aria-label="Create Event">Create</Button>
    </div>
</div>
