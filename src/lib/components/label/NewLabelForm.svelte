<script lang="ts">
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import { dispatch } from '$lib/dataChangeEvents';
    import { nowUtc } from '$lib/utils/time';
    import { createEventDispatcher } from 'svelte';
    import { Event } from '$lib/controllers/event/event';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';

    const dispatchEvent = createEventDispatcher();

    let labelName = '';
    let labelColor = Event.DEFAULT_COLOR;

    async function closeHandler() {
        if (!labelName) {
            notify.error('Invalid Name');
            return;
        }

        const { id } = notify.onErr(
            await api.post('/labels', {
                name: labelName,
                color: labelColor
            })
        );

        const label: Label = { id, color: labelColor, name: labelName, created: nowUtc() };
        await dispatch.create('label', label);

        labelName = '';

        notify.success('Label created');
        dispatchEvent('submit');
    }
</script>

<div>
    <div>
        <h2>New Label</h2>
    </div>
    <div class="content">
        <Textbox label="Name" bind:value={labelName} />

        <label>
            Color <br />
            <input bind:value={labelColor} type="color" />
            <input bind:value={labelColor} type="text" />
        </label>
    </div>
    <div class="flex-center">
        <button class="primary" on:click={closeHandler} aria-label="Create"> Create </button>
    </div>
</div>

<style lang="scss">
    @import '$lib/styles/text';

    label {
        @extend .text-light;

        display: block;
        margin: 1rem;

        input {
            margin: 0.2rem 0 0 0;
        }
    }
</style>
