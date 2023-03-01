<script lang="ts">
    import { GETArgs } from '$lib/utils';
    import { sha256 } from 'js-sha256';
    import ChevronRight from 'svelte-material-icons/ChevronRight.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../app';
    import { api } from '../lib/api/apiQuery';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData;

    let password = '';
    let username = '';

    async function login (): Promise<void> {
        const res = await api.get(
            data,
            `/auth${GETArgs({
                key: sha256(password).substring(0, 32),
                username,
            })}`,
        );

        if (res?.body?.error) {
            return void addNotification({
                text: res?.body?.error,
                position: 'top-center',
                type: 'error',
                removeAfter: 4000,
            });
        }
        window.location.href = '/home';
    }

    async function create (): Promise<void> {
        const res = await api.post(data, `/users`, {
            password: sha256(password).substring(0, 32),
            username,
        });

        if (res.body?.error) {
            return void addNotification({
                text: res.body?.error,
                position: 'top-center',
                type: 'error',
                removeAfter: 4000,
            });
        }
        window.location.href = '/home';
    }
</script>

<main>
    <div class="flex-center page-center form">
        <div class="content">
            <label>
                Username
                <input
                    autocomplete="username"
                    bind:value={username}
                    style="font-size: x-large"
                />
            </label>
            <label>
                Password
                <input
                    autocomplete="current-password"
                    bind:value={password}
                    style="font-size: x-large"
                    type="password"
                />
            </label>
            <div class="flex-center" style="justify-content: space-between">
                <button
                    on:click|preventDefault={create}
                    type="button"
                >
                    Sign Up
                </button>
                <button
                    class="primary"
                    on:click|preventDefault={login}
                    type="button"
                >
                    <ChevronRight size="30" />
                    Log In
                </button>
            </div>
        </div>
    </div>
</main>

<style lang="less">
    .form {
        .content, form input {
            max-width: 94vw;
        }

        label {
            display: flex;
            flex-direction: column;
            margin: 1rem 0;
        }
    }
</style>