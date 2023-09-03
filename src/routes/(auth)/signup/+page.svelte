<script lang="ts">
    import { goto } from '$app/navigation';
    import { Auth } from '$lib/controllers/auth/auth';
    import { encryptionKey, passcodeLastEntered, username as usernameStore } from '$lib/stores';
    import { nowUtc } from '$lib/utils/time';
    import { tooltip } from '@svelte-plugins/tooltips';
    import ArrowRightThinCircleOutline from 'svelte-material-icons/ArrowRightThinCircleOutline.svelte';
    import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
    import { populateCookiesAndSettingsAfterAuth } from '../actions.client';
    import type { PageData } from './$types';
    import { api } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import Dot from '$lib/components/Dot.svelte';

    export let data: PageData;

    async function create(): Promise<void> {
        actionPending = true;

        const key = Auth.encryptionKeyFromPassword(password.value);
        encryptionKey.set(key);

        notify.onErr(
            await api.post(
                `/users`,
                {
                    encryptionKey: key,
                    username: username.value
                },
                { doNotEncryptBody: true }
            ),
            () => (actionPending = false)
        );

        usernameStore.set(username.value);

        if (passcode.value) {
            notify.onErr(
                await api.put(`/settings`, {
                    key: 'passcode',
                    value: passcode.value
                }),
                () => (actionPending = false)
            );
            passcodeLastEntered.set(nowUtc());
        }

        await populateCookiesAndSettingsAfterAuth(() => (actionPending = false));

        await goto('/' + data.redirect);
    }

    function usernameInputKeypress(event: { code: string }) {
        if (event.code === 'Enter') {
            password.focus();
        }
    }

    function passwordInputKeypress(event: { code: string }) {
        if (event.code === 'Enter') {
            passcode.focus();
        }
    }

    function passcodeInputKeypress(event: { code: string }) {
        if (event.code === 'Enter') {
            void create();
        }
    }

    // user log in / create account form values
    let password: HTMLInputElement;
    let username: HTMLInputElement;
    let passcode: HTMLInputElement;

    let actionPending = false;
</script>

<svelte:head>
    <title>Sign Up</title>
    <meta content="Sign up to Halcyon.Land" name="description" />
</svelte:head>

<main class="flex-center">
    <div class="content">
        <label>
            Username
            <input
                aria-label="Username"
                autocomplete="username"
                bind:this={username}
                disabled={actionPending}
                on:keypress={usernameInputKeypress}
            />
        </label>
        <label>
            <span>
                Password
                <Dot />
                <i
                    use:tooltip={{
                        content: 'Your account cannot be recovered ' + 'if you lose your password!'
                    }}
                >
                    <span class="text-warning">Warning</span>
                    <InformationOutline size="20" />
                </i>
            </span>
            <input
                aria-label="Password"
                autocomplete="new-password"
                bind:this={password}
                disabled={actionPending}
                type="password"
                on:keypress={passwordInputKeypress}
            />
        </label>
        <label>
            <span>
                Passcode
                <Dot />
                <i
                    use:tooltip={{
                        content:
                            'An optional additional layer of security ' +
                            'which can be changed later in settings'
                    }}
                >
                    Optional
                    <InformationOutline size="20" />
                </i>
            </span>
            <input
                aria-label="Passcode"
                bind:this={passcode}
                disabled={actionPending}
                type="password"
                placeholder="No passcode"
                on:keypress={passcodeInputKeypress}
            />
        </label>
        <div class="flex-center" style="justify-content: space-between">
            <a href="/login?redirect={data.redirect}">Log In</a>
            <button
                aria-label="Create Account"
                disabled={actionPending}
                on:click|preventDefault={create}
                type="button"
                class="primary with-icon icon-right"
            >
                Create Account
                <ArrowRightThinCircleOutline size="25" />
            </button>
        </div>
    </div>
</main>

<style lang="less">
    @import '../../../styles/layout';
    @import '../../../styles/text';

    main {
        .flex-center();
        height: 100vh;
    }

    .content {
        max-width: 90vw;

        button {
            margin: 0;
        }
    }

    input {
        width: 300px;
        font-size: 1.3rem;
        margin-top: 0.1rem;
    }

    label {
        display: flex;
        flex-direction: column;
        margin: 3rem 0;

        & > span {
            display: flex;
            align-items: center;
            justify-content: start;
            gap: 0.3rem;
        }

        i {
            .text-light();
            display: flex;
            flex-direction: row;
            gap: 0.3rem;
            align-items: center;
            font-size: 0.98rem;

            :global(svg) {
                height: 100%;
            }
        }
    }
</style>
