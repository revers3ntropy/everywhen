<script lang="ts">
    import { goto } from '$app/navigation';
    import { popup } from '$lib/stores';
    import type { Auth } from '$lib/controllers/user';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/notifications/notifications';

    export let auth: Auth;

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

        submitted = true;
        displayNotifOnErr(
            await api.put(auth, '/auth', {
                currentPassword,
                newPassword
            }),
            () => (submitted = false)
        );

        await goto('/logout');
    }
</script>

<h1>Change Password</h1>

<div class="content">
    <p>
        <span class="text-warning">Warning!</span>
        If you lose your password, your account cannot be recovered
    </p>

    <div class="form">
        <label>
            Current Password
            <input
                type="password"
                autocomplete="current-password"
                bind:value={currentPassword}
                disabled={submitted}
            />
        </label>
        <label>
            New Password
            <input
                type="password"
                autocomplete="new-password"
                bind:value={newPassword}
                disabled={submitted}
            />
        </label>
        <label>
            Confirm New Password
            <input
                type="password"
                autocomplete="new-password"
                bind:value={confirmNewPassword}
                disabled={submitted}
            />
            {#if passwordsDoNotMatch}
                <span class="text-warning">Passwords do not match</span>
            {/if}
        </label>
        <div class="flex-space-evenly">
            <button
                class="primary"
                aria-label="change password submit"
                disabled={submitted}
                on:click={change}
            >
                Change Password
            </button>
            <button
                on:click={() => ($popup = null)}
                aria-label="cancel change password"
                disabled={submitted}
            >
                Cancel
            </button>
        </div>
    </div>
</div>

<style lang="less">
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
