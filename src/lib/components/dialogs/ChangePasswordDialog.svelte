<script lang="ts">
    import { goto } from '$app/navigation';
    import { popup } from '$lib/stores';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { Auth } from '../../controllers/user';
    import { api } from '../../utils/apiRequest';
    import { displayNotifOnErr } from '../../utils/notifications';

    const { addNotification } = getNotificationsContext();

    export let auth: Auth;

    let currentPassword = '';
    let newPassword = '';
    let confirmNewPassword = '';

    let passwordsDoNotMatch = false;

    async function change() {
        if (newPassword !== confirmNewPassword) {
            passwordsDoNotMatch = true;
            return;
        }
        passwordsDoNotMatch = false;

        console.log('req');
        displayNotifOnErr(
            addNotification,
            await api.put(auth, '/auth', {
                currentPassword,
                newPassword
            })
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
            />
        </label>
        <label>
            New Password
            <input
                type="password"
                autocomplete="new-password"
                bind:value={newPassword}
            />
        </label>
        <label>
            Confirm New Password
            <input
                type="password"
                autocomplete="new-password"
                bind:value={confirmNewPassword}
            />
            {#if passwordsDoNotMatch}
                <span class="text-warning">Passwords do not match</span>
            {/if}
        </label>
        <div class="flex-space-evenly">
            <button
                class="primary"
                aria-label="change password submit"
                on:click={change}>Change Password</button
            >
            <button
                on:click={() => ($popup = null)}
                aria-label="cancel change password">Cancel</button
            >
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
