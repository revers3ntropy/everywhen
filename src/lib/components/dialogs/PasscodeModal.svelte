<script lang="ts">
    import { Auth } from '$lib/controllers/auth/auth';
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
    import { browser } from '$app/environment';
    import Close from 'svelte-material-icons/Close.svelte';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { encryptionKey, passcodeLastEntered } from '$lib/stores';
    import { nowUtc } from '$lib/utils/time';
    import { wheel } from '$lib/utils/toggleScrollable';

    export let show = true;
    export let passcode: string;
    export let showingForgotPassword = false;

    onMount(() => {
        loaded = true;
        scrollElement = document.getElementsByClassName('root')[0];
    });

    let input: string;
    let passwordInput: string;
    let lastYScroll = 0;
    let scrollElement: Element | undefined;
    let loaded = false;

    $: if (browser) {
        let valid = (input || '') === passcode;
        if (showingForgotPassword) {
            const passwordIsValid =
                Auth.encryptionKeyFromPassword(passwordInput || '') === $encryptionKey;
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
        <div class="content bg-vLightAccent">
            <h1 class="pb-8">Enter your passcode</h1>
            <!-- svelte-ignore a11y-autofocus -->
            <input
                type="text"
                bind:value={input}
                placeholder="Passcode"
                autocomplete="off"
                autofocus
                data-lpignore="true"
                class="password-input px-1 text-xl"
            />
            <button on:click={() => (input = '')} aria-label="Clear passcode">
                <Close />
            </button>

            <div class="forgot-passcode">
                <button class="text-light" on:click={() => (showingForgotPassword = true)}>
                    Forgot Passcode?
                </button>
                <div class="pt-8">
                    {#if showingForgotPassword}
                        <input
                            type="text"
                            bind:value={passwordInput}
                            placeholder="Enter Password"
                            autocomplete="off"
                            data-lpignore="true"
                            class="password-input px-1 text-xl"
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

<style lang="scss">
    @import '$lib/styles/layout';

    h1 {
        text-align: left;
    }

    .modal-container {
        @extend .flex-center;

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
            @extend .container-shadow;
            backdrop-filter: blur(30px);
            padding: 2rem 3rem 3rem 3rem;
            border-radius: $border-radius;

            @media #{$mobile} {
                padding: 2rem 4px 3rem 1rem;
                width: 100%;
                border-radius: 0;
            }

            .password-input {
                -webkit-text-security: disc;
                -moz-text-security: disc;
                max-width: 85vw;
            }

            .forgot-passcode {
                margin-top: 4rem;
                text-align: left;
            }
        }
    }
</style>
