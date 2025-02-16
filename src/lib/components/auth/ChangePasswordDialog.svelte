<script lang="ts">
    import { AlertCircle } from 'lucide-svelte';
    //import * as Dialog from '$lib/components/ui/dialog';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { Entry } from '$lib/controllers/entry/entry';
    import { username } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import { Auth } from '$lib/controllers/auth/auth';

    let currentPassword = '';
    let newPassword = '';
    let confirmNewPassword = '';

    let passwordsDoNotMatch = false;

    let submitted = false;

    async function change() {
        if (newPassword !== confirmNewPassword) {
            passwordsDoNotMatch = true;
            return;
        }
        passwordsDoNotMatch = false;

        let finished = false;
        setTimeout(() => {
            if (finished) return;
            notify.info('Re-encrypting data, may take a while...');
        }, 1000);

        submitted = true;
        notify.onErr(
            await api.put('/auth', {
                currentPassword,
                newPassword
            }),
            () => (submitted = false)
        );

        finished = true;

        Entry.clearEntryFormKeys($username, localStorage);

        await Auth.logOut();
    }
</script>

<h2 class="md:pl-6 pt-4">Change Password</h2>

<div class="py-4 md:p-6 max-w-[36rem]">
    <div class="mb-4 flex items-center gap-4">
        <span class="text-warning"><AlertCircle /></span>
        If you lose your password, your account cannot be recovered
    </div>

    <div class="flex flex-col gap-4">
        <Textbox
            label="Current Password"
            type="password"
            autocomplete="current-password"
            bind:value={currentPassword}
            disabled={submitted}
        />
        <Textbox
            label="New Password"
            type="password"
            autocomplete="new-password"
            bind:value={newPassword}
            disabled={submitted}
        />
        <Textbox
            label="Confirm New Password"
            type="password"
            autocomplete="new-password"
            bind:value={confirmNewPassword}
            disabled={submitted}
        />
        {#if passwordsDoNotMatch}
            <span class="text-warning">Passwords do not match</span>
        {/if}
        <div class="flex justify-between items-center w-full">
            <button
                class="primary"
                aria-label="change password submit"
                disabled={submitted}
                on:click={change}
            >
                <span> Change Password </span>
            </button>
            <button
                on:click={() => popup.set(null)}
                aria-label="cancel change password"
                disabled={submitted}
            >
                Cancel
            </button>
        </div>
    </div>
</div>
