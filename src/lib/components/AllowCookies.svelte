<script lang="ts">
    import { allowedCookies } from '$lib/stores';
    import { Auth } from '$lib/controllers/auth/auth';
</script>

<div class="wrapper">
    <div class="content">
        <h3> Cookies </h3>
        <p class="text-light">
            We use cookies or similar technologies for technical purposes and, with your consent,
            for other purposes. Denying consent may make related features unavailable. You can
            freely give, deny, or withdraw your consent at any time. You can consent to the use of
            such technologies by using the “Accept” button.
        </p>
        <button
            class="primary"
            on:click={() => allowedCookies.set(true)}
            aria-label="Accept Cookies"
        >
            Accept
        </button>
        <button class="secondary" on:click={() => void Auth.logOut()} aria-label="Deny Cookies">
            Deny
        </button>
    </div>
</div>

<style lang="scss">
    @import '../../styles/variables';
    @import '../../styles/layout';

    .content {
        @extend .container-shadow;
        margin: 1rem;
        padding: 1rem;
        background: var(--light-accent);
        border-radius: $border-radius;
    }

    .wrapper {
        position: fixed;
        bottom: 0;
        left: 0;
        z-index: 1000;
        width: 95%;
        max-width: min(400px, calc(100vw - 70px));
        height: fit-content;
    }

    button.primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
</style>
