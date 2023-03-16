<script lang="ts">

	import type { Label } from '../controllers/label';

	export let label: Label | null = null;

    export let obfuscated = true;
</script>

{#if label}
	<a class="label has-label" href="/labels/{label.id}">
		<span class="colour" style="background: {label.colour}"></span>
        <span class="name {obfuscated ? 'obfuscated' : ''}">
			{label.name}
		</span>
	</a>
{:else}
    <span style="margin: 0 .5em"></span>
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
