<script lang="ts">
    import { ANIMATION_DURATION } from '$lib/constants';
    import { lastTipNumber } from '$lib/stores';
    import { onMount } from 'svelte';
    import ArrowRight from 'svelte-material-icons/ArrowRight.svelte';
    import { slide } from 'svelte/transition';

    type Tip = string;

    const tips: Tip[] = [
        `You can submit a bullet entry by pressing <code>Enter</code>`,
        `Right click on the <a href="/map">map</a> and 'Add Named Location' to group entries by their location`,
        `Drag the three dots on the right side of events in the <a href="/timeline">timeline</a> to change their duration`,
        `Drag the right side of the screen in the <a href="/timeline">timeline</a> to zoom in and out on mobile`,
        `'Favourite' an entry under the <code>⋮</code> on an entry, and it will appear right here on the <a href="/home">home</a> page`,
        `Set a passcode in the <a href="/settings">settings</a> as an additional layer of security`,
        `All your data is encrypted, and only you have the key: no matter what, no-one can read your data without knowing your password`,
        `Learn more about Halcyon.Land on the <a href="/about">about</a> page`,
        `You can view all the images you have uploaded in the <a href="/assets">gallery</a> page`,
        `Scroll to zoom the <a href="/timeline">timeline</a> in and out`,
        `You can view what words you use the most on the <a href="/stats">analytics</a> page`,
        `Press <code>Ctrl + Esc</code> (or <code>Pause</code> if your keyboard has it) to quickly blur / un-blur the entire page`,
        `You can download a backup of all of your data from <a href="/settings">settings</a>`,
        `When you edit an entry, all previous versions are stored`
    ];

    function incrementLastTipNumber() {
        lastTipNumber.update(n => {
            if (n === null || n >= tips.length - 1) {
                return 0;
            }
            return n + 1;
        });
    }

    onMount(incrementLastTipNumber);
</script>

<div class="container">
    <div>
        {#if $lastTipNumber === null}
            <h3> Did you know? </h3>
            <p> ... </p>
        {:else}
            <div class="flex-center" style="justify-content: space-between">
                <h3> Did you know? #{($lastTipNumber || 0) + 1} </h3>
                <button on:click={incrementLastTipNumber} aria-label="Next tip">
                    <ArrowRight size="30" />
                </button>
            </div>
            {#key $lastTipNumber}
                <p transition:slide={{ duration: ANIMATION_DURATION, axis: 'y' }}>
                    {@html tips[$lastTipNumber]}
                </p>
            {/key}
        {/if}
    </div>
</div>

<style lang="less">
    @import '../../styles/variables';

    .container {
        padding: 1rem;

        h3 {
            margin: 0 0 0.5rem 0;
        }

        p {
            @media @not-mobile {
                // constant height: very important
                // stops layout shifts when the tip changes
                height: 3rem;
            }
        }
    }
</style>
