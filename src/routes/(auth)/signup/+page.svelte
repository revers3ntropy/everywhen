<script lang="ts">
    import type { PageData } from './$types';
    import Dot from '$lib/components/Dot.svelte';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications.js';
    import { api } from '$lib/utils/apiRequest.js';
    import { encryptionKeyFromPassword } from '$lib/security/authUtils.client.js';
    import { goto } from '$app/navigation';
    import { tooltip } from '@svelte-plugins/tooltips';
    import { onMount } from 'svelte';
    import ArrowRightThinCircleOutline from 'svelte-material-icons/ArrowRightThinCircleOutline.svelte';
    import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';

    export let data: PageData;

    // user log in / create account form values
    let password = '';
    let username = '';
    let passcode = '';

    let actionPending = false;

    async function create(): Promise<void> {
        actionPending = true;
        const auth = displayNotifOnErr(
            await api.post(null, `/users`, {
                password: encryptionKeyFromPassword(password),
                username
            }),
            () => (actionPending = false)
        );
        if (passcode) {
            displayNotifOnErr(
                await api.put(auth, `/settings`, {
                    key: 'passcode',
                    value: passcode
                }),
                () => (actionPending = false)
            );
        }
        await goto('/' + data.redirect);
    }

    onMount(() => (document.title = 'Sign Up'));
</script>

<svelte:head>
    <title>Sign Up</title>
    <meta content="Sign up to halcyon.land" name="description" />
</svelte:head>

<main class="flex-center">
    <div class="content">
        <label>
            Username
            <input
                aria-label="Username"
                autocomplete="username"
                bind:value={username}
                disabled={actionPending}
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
                bind:value={password}
                disabled={actionPending}
                type="password"
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
                bind:value={passcode}
                disabled={actionPending}
                type="password"
                placeholder="No passcode"
            />
        </label>
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
</main>

<style lang="less">
    @import '../../../styles/layout';
    @import '../../../styles/text';

    main {
        .flex-center();
        height: 100vh;
    }

    .content {
        max-width: 94vw;

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
