<script lang="ts">
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import { dispatch } from '$lib/dataChangeEvents';
    import { nowUtc } from '$lib/utils/time';
    import { createEventDispatcher } from 'svelte';
    import { Event } from '$lib/controllers/event/event';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { tryEncryptText } from '$lib/utils/encryption.client';

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
                name: tryEncryptText(labelName),
                color: labelColor
            })
        );

        const label = { id, color: labelColor, name: labelName, created: nowUtc() } satisfies Label;
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

        <label class="block mx-4 my-4 text-light">
            Color <br />
            <input bind:value={labelColor} type="color" class="mt-[0.2rem]" />
            <input bind:value={labelColor} type="text" class="mt-[0.2rem]" />
        </label>
    </div>
    <div class="flex-center">
        <button class="primary" on:click={closeHandler} aria-label="Create"> Create </button>
    </div>
</div>
