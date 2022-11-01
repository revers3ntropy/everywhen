<script lang="ts">
	import Notebook from 'svelte-material-icons/Notebook.svelte';
</script>

<main>
	<section class="buttons">
		<a href="/diary">
			<Notebook size="30"/>
			Diary
		</a>
	</section>
</main>

<style lang="less">
	@import '../../styles/variables.less';
	.buttons {
		display: flex;
		justify-content: space-between;

		a, button {
			display: grid;
			align-items: center;
			justify-content: space-between;
			// assumed one svg icon and then text
			grid-template-columns: 35px 1fr;
			font-size: 1.2rem;
			padding: .7em 1.2em;
			margin: 1em;
			border: 1px solid #ccc;
			border-radius: 5px;
			text-decoration: none;
			transition: all 0.2s ease;
			color: @accent-color-primary;

			&:after { display: none }

			&:hover {
				background: @light-accent;
				color: @accent-color-secondary;
				text-decoration: none;

			}
		}
	}
</style>
