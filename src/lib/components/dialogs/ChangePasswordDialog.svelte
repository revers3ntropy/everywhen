<script lang="ts">
    import { Entry } from '$lib/controllers/entry/entry';
    import { popup, username } from '$lib/stores';
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

<h1>Change Password</h1>

<div class="content">
    <div class="pb-8">
        <div class="text-warning pb-2">Warning!</div>
        If you lose your password, your account cannot be recovered
    </div>

    <div class="form">
        <label>
            Current Password
            <input
                type="password"
                class="textbox"
                autocomplete="current-password"
                bind:value={currentPassword}
                disabled={submitted}
            />
        </label>
        <label class="pt-4">
            New Password
            <input
                type="password"
                class="textbox"
                autocomplete="new-password"
                bind:value={newPassword}
                disabled={submitted}
            />
        </label>
        <label>
            Confirm New Password
            <input
                type="password"
                class="textbox"
                autocomplete="new-password"
                bind:value={confirmNewPassword}
                disabled={submitted}
            />
            {#if passwordsDoNotMatch}
                <span class="text-warning">Passwords do not match</span>
            {/if}
        </label>
        <div class="flex-space-evenly gap-4">
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

<style lang="scss">
    .content {
        margin: 1rem 0 0 2rem;
    }

    .form {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2rem;
        width: 100%;

        label {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
</style>
