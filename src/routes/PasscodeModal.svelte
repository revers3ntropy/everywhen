<script lang="ts">
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    import { passcodeLastEntered } from '../lib/stores';
    import { nowS } from '../lib/utils/time';
    import { wheel } from '../lib/utils/toggleScrollable';

    export let show = true;
    export let passcode: string;

    let input: string;

    let loaded = false;
    onMount(() => {
        loaded = true;
    });

    let lastYScroll = 0;

    $: if (input === passcode && browser) {
        input = '';
        passcodeLastEntered.set(nowS());
        show = false;
        setTimeout(() => {
            window.scrollTo(0, lastYScroll);
            lastYScroll = 0;
        }, 0);
    }

    $: if (show && !lastYScroll && browser) {
        lastYScroll = window.scrollY;
    }
</script>

<svelte:window use:wheel={{ scrollable: !show }} />

<div class="modal-container {show ? 'show' : ''}">
    {#if loaded}
        <div class="content">
            <h1>Please enter your passcode</h1>
            <!-- svelte-ignore a11y-autofocus -->
            <input
                type="text"
                bind:value={input}
                placeholder="Passcode"
                autocomplete="off"
                autofocus
                data-lpignore="true"
                class="password-input"
            >
        </div>
    {/if}
</div>

<style lang="less">
    @import '../styles/layout';

    .modal-container {
        .flex-center();

        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.2);
        z-index: 100;
        margin: 0;
        padding: 0;
        border-radius: 0;
        border: none;
        backdrop-filter: blur(15px);
        overflow: auto;
        display: none;

        &.show {
            display: flex;
        }

        .content {
            text-align: center;

            .password-input {
                -webkit-text-security: disc;
                -moz-text-security: disc;
                text-security: disc;
            }
        }
    }
</style>