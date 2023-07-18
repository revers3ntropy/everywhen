<script lang="ts">
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
    import { browser } from '$app/environment';
    import Close from 'svelte-material-icons/Close.svelte';
    import type { Auth } from '$lib/controllers/user/user';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { encryptionKeyFromPassword } from '$lib/security/authUtils.client';
    import { passcodeLastEntered } from '$lib/stores';
    import { nowUtc } from '$lib/utils/time';
    import { wheel } from '$lib/utils/toggleScrollable';

    export let auth: Auth;
    export let show = true;
    export let passcode: string;
    export let showingForgotPassword = false;

    let input: string;
    let passwordInput: string;
    let lastYScroll = 0;
    let scrollElement: Element | undefined;
    let loaded = false;
    onMount(() => {
        loaded = true;
        scrollElement = document.getElementsByClassName('root')[0];
    });

    $: if (browser) {
        let valid = (input || '') === passcode;
        if (showingForgotPassword) {
            const passwordIsValid = encryptionKeyFromPassword(passwordInput || '') === auth.key;
            valid ||= passwordIsValid;
        }
        if (valid) {
            input = '';
            passcodeLastEntered.set(nowUtc());
            show = false;
            setTimeout(() => {
                if (!scrollElement) return;
                scrollElement.scrollTop = lastYScroll;
                lastYScroll = 0;
            }, 0);
        }
    }

    $: if (show && !lastYScroll && browser) {
        lastYScroll = scrollElement?.scrollTop || 0;
    }
</script>

<svelte:window use:wheel={{ scrollable: !show }} />

<div class="modal-container {show ? 'show' : ''}">
    {#if loaded}
        <div class="content">
            <h1>Enter your passcode</h1>
            <!-- svelte-ignore a11y-autofocus -->
            <input
                type="text"
                bind:value={input}
                placeholder="Passcode"
                autocomplete="off"
                autofocus
                data-lpignore="true"
                class="password-input"
            />
            <button on:click={() => (input = '')} aria-label="Clear passcode">
                <Close />
            </button>

            <div class="forgot-passcode">
                <button class="text-light" on:click={() => (showingForgotPassword = true)}>
                    Forgot Passcode?
                </button>
                <div>
                    {#if showingForgotPassword}
                        <input
                            type="text"
                            bind:value={passwordInput}
                            placeholder="Enter Password"
                            autocomplete="off"
                            data-lpignore="true"
                            class="password-input"
                            transition:slide={{
                                axis: 'y',
                                duration: ANIMATION_DURATION
                            }}
                        />
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<style lang="less">
    @import '../../../styles/layout';

    h1 {
        text-align: left;
    }

    .modal-container {
        .flex-center();

        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: var(--blur-bg-color);
        z-index: 1500;
        margin: 0;
        padding: 0;
        border-radius: 0;
        border: none;
        backdrop-filter: blur(18px);
        overflow: auto;
        display: none;

        &.show {
            display: flex;
        }

        .content {
            .container-shadow();
            background: var(--transluscent-bg);
            backdrop-filter: blur(30px);
            padding: 2rem 3rem 3rem 3rem;
            border-radius: @border-radius;

            @media @mobile {
                padding: 2rem 4px 3rem 1rem;
                width: 100%;
                border-radius: 0;
            }

            .password-input {
                margin-top: 2rem;
                font-size: 20px;
                -webkit-text-security: disc;
                -moz-text-security: disc;
                max-width: 90vw;
            }

            .forgot-passcode {
                margin-top: 4rem;
                text-align: left;
            }
        }
    }
</style>
