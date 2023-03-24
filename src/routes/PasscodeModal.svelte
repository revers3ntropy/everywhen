<script lang="ts">
    import { onMount } from 'svelte';
    import { passcodeLastEntered } from '../lib/stores';
    import { nowS } from '../lib/utils/time';

    export let show = true;
    export let passcode: string;

    let input: string;

    let loaded = false;
    onMount(() => {
        loaded = true;
    });

    $: if (input === passcode) {
        passcodeLastEntered.set(nowS());
        show = false;
        input = '';
    }
</script>

{#if show}
    <div class="modal-container">
        {#if loaded}
            <div class="content">
                <h1>Please enter your passcode</h1>
                <input
                    type="text"
                    bind:value={input}
                    placeholder="Passcode"
                    autocomplete="off"
                    autofocus
                >
            </div>
        {/if}
    </div>
{/if}

<style lang="less">
    @import '../styles/layout';

    .modal-container {
        .flex-center();

        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.2);
        z-index: 100;
        margin: 0;
        padding: 0;
        border-radius: 0;
        border: none;
        backdrop-filter: blur(15px);

        .content {
            text-align: center;
        }
    }
</style>