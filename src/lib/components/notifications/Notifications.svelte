<script lang="ts">
    import { ANIMATION_DURATION } from '$lib/constants';
    import {
        notifications,
        NotificationType,
        removeNotification
    } from '$lib/components/notifications/notifications';
    import { fly } from 'svelte/transition';
    import Close from 'svelte-material-icons/Close.svelte';
    import ExclamationThick from 'svelte-material-icons/ExclamationThick.svelte';
    import CheckThick from 'svelte-material-icons/CheckBold.svelte';
</script>

<div class="notifications">
    {#each $notifications.sort((a, b) => b.created - a.created) as notif, i (notif)}
        <div
            class="notification type-{notif.type}"
            in:fly={{
                y: i === 0 ? 0 : -20,
                x: i === 0 ? -50 : 0,
                duration: ANIMATION_DURATION
            }}
            out:fly={{
                x: 50,
                duration: ANIMATION_DURATION
            }}
        >
            <span class="icon">
                {#if notif.type === NotificationType.ERROR}
                    <ExclamationThick />
                {:else if notif.type === NotificationType.INFO}
                    <span class="info-symbol">i</span>
                {:else}
                    <CheckThick />
                {/if}
            </span>
            <span class="text">
                {notif.text}
            </span>
            <span class="close">
                <button on:click={() => removeNotification(notif)}>
                    <Close />
                </button>
            </span>
        </div>
    {/each}
</div>

<style lang="scss">
    @import '$lib/styles/layout';

    .notifications {
        position: fixed;
        top: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        z-index: 1000;
        pointer-events: none;

        .notification {
            @extend .container-shadow;

            background: var(--light-accent);

            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            justify-content: center;

            margin: 0.5rem;
            padding: 0.5rem;
            grid-gap: 0.5rem;

            border-radius: $border-radius;

            pointer-events: all;

            .icon {
                background: var(--v-light-accent);
                border-radius: 50%;
                aspect-ratio: 1/1;
                width: fit-content;
                padding: 6px;
                display: grid;
                place-items: center;
            }

            &.type-error {
                .icon {
                    background: var(--accent-danger);
                }
            }

            &.type-info {
                .icon {
                    background: var(--primary);
                }
            }

            &.type-success {
                .icon {
                    background: green;
                }
            }
        }
    }

    .info-symbol {
        font-size: 16px;
        font-weight: bold;
        aspect-ratio: 1/1;
        height: 16px;
        width: 16px;
        display: grid;
        place-items: center;
    }
</style>
