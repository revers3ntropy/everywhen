<script lang="ts">
    import { getNotificationsContext } from 'svelte-notifications';

    export const { addNotification: add } = getNotificationsContext();

    export function addNotification<T>(props: Record<string, T>) {
        add({
            removeAfter: 4000,
            position: 'top-center',
            ...props
        });
    }
</script>
