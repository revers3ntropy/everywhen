<script lang="ts">
    import { page } from '$app/stores';
</script>

<main>
    <div>
        <div>
            {$page.status}
        </div>
        <div>
            {$page.error?.message || 'An error occurred'}
        </div>
    </div>
</main>

<style lang="less">
    @import '../styles/layout';

    main {
        font-size: 2em;

        & > div {
            .page-center();
            width: fit-content;
            display: grid;
            grid-template-columns: 3em 1fr;
            place-items: center;

            & > :first-child {
                border-right: 2px solid var(--border-heavy);
                text-align: right;
            }

            & > div {
                padding: 1rem;
            }

            & > :last-child {
                text-align: left;
                font-size: 1.3rem !important;
            }
        }
    }
</style>
