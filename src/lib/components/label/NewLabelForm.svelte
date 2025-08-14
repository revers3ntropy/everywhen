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
        const encryptedName = tryEncryptText(labelName);

        const { id } = notify.onErr(
            await api.post('/labels', {
                name: encryptedName,
                color: labelColor
            })
        );

        const label = {
            id,
            color: labelColor,
            name: encryptedName,
            created: nowUtc()
        } satisfies Label;
        await dispatch.create('label', label);

        labelName = '';

        notify.success('Label created');
        dispatchEvent('submit');
    }
</script>

<div>
    <p class="title-font text-xl"> New Label </p>
    <div class="content">
        <Textbox label="Name" bind:value={labelName} />

        <label class="block my-4 text-light">
            Color
            <span class="flex gap-2 items-center">
                <input bind:value={labelColor} type="color" />
                <input bind:value={labelColor} type="text" />
            </span>
        </label>
    </div>
    <div class="pb-4">
        <button class="primary" on:click={closeHandler} aria-label="Create"> Create </button>
    </div>
</div>
