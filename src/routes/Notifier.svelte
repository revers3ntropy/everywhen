<script lang="ts">
	import { getNotificationsContext } from 'svelte-notifications';

	export const { addNotification: add } = getNotificationsContext();

	export function addNotification(props: Record<string, any>) {
        console.log(props);
		add({
			removeAfter: 4000,
			position: 'top-center',
			...props
		});
	}
</script>
