<script lang="ts">
	import type { Label } from '$lib/types';

	export let label: Label = null;
</script>

{#if label}
	<a class="label has-label" href="/labels/{label.id}">
		<span class="colour" style="background: {label.colour}" />
		<span class="name">
			{label.name}
		</span>
	</a>
{:else}
	<span style="margin: 0 .5em" />
{/if}

<style lang="less">
	@import '../../styles/variables.less';

	.label {
		margin: 0.5em;
		width: fit-content;
		padding: 5px;
		border-radius: 10px;
		display: inline-grid;
		align-items: center;
		align-content: center;
		justify-items: center;
		justify-content: space-between;
		grid-template-columns: 25px 1fr;
		background: @border;

		&:hover {
			background: @accent-color-primary;
			* {
				color: black;
			}
		}

		.name {
			margin-left: 5px;
		}

		.colour {
			height: 20px;
			width: 20px;
			border-radius: 50%;
		}
	}
</style>
