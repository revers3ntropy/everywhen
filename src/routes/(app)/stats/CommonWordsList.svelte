<script lang="ts">
    import type { Auth } from '$lib/controllers/user/user';
    import { encrypt } from '$lib/security/encryption.client';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications.js';

    export let auth: Auth;
    export let words: [string, number][];
    export let entryCount: number;
</script>

<div class="common-words">
    {#each words as [word, count], i}
        <div>#{i + 1}</div>
        <a
            href="/stats/{displayNotifOnErr(encrypt(word, auth.key))}"
            class="word"
            data-sveltekit-preload-data="tap"
        >
            {word}
        </a>

        <b class="count">{count}</b>

        <div class="per-entry">
            {(count / entryCount).toPrecision(3)} / entry
        </div>

        {#if i < words.length - 1}
            <hr />
        {/if}
    {/each}
</div>

{#if words.length === 0}
    <p class="text-light">No words yet</p>
{/if}

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/text';

    .common-words {
        margin: 0.5em 0;
        display: grid;
        grid-template-columns: 3rem 1fr 4rem 8rem;
        grid-row-gap: 0.3rem;
        max-width: 900px;

        @media @mobile {
            margin: 10px 0;
            padding: 10px 2px;
            grid-template-columns: 3rem 1fr 1fr;

            .per-entry {
                display: none;
            }

            .count {
                text-align: right;
                margin-right: 2rem;
            }
        }

        .word {
            .ellipsis();
        }

        hr {
            grid-column: 1 / 5;
            margin: 0.5rem 0;
            height: 0;
            border: 1px solid var(--border-light);
        }
    }
</style>
