<script lang="ts">
	import Time from 'svelte-time';
	import moment from 'moment';
	import Close from 'svelte-material-icons/Close.svelte';
	import Menu from 'svelte-material-icons/Menu.svelte';
	import type { Entry } from '$lib/types';

	export let titles: Record<number, Entry[]>;
	export let obfuscated = true;

	let showing = false;
</script>

<div>
	<div class="floating-button">
		<button on:click={() => (showing = !showing)}>
			<Menu size="40" />
		</button>
	</div>
	<div class="sidebar {showing ? 'showing' : ''}">
		<div class="header">
			<button on:click={() => (showing = !showing)}>
				<Close size="30" />
			</button>
		</div>
		<div class="content">
			{#each Object.keys(titles).sort((a, b) => b - a) as day}
				<div class="day">
					<h2>
						<Time format="dddd DD/MM/YY" timestamp={new Date(day * 1000)} />
						<span class="light">
							{#if new Date() - new Date(day * 1000) < 8.64e7}
								Today
							{:else if new Date() - new Date(day * 1000) < 2 * 8.64e7}
								Yesterday
							{:else}
								<Time relative
									  timestamp={new Date(
											day * 1000 + (60 * 60 * 23 + 60 * 60 + 59) * 1000
										)}
									  class="light"
								/>
							{/if}
						</span>
					</h2>

					{#each titles[day] as entry}
						<a class="entry" href="/diary/{entry.id}">
							<span class="entry-time">
								{moment(new Date(entry.created * 1000)).format('h:mm A')}
							</span>
							<span
								class="entry-label-colour"
								style="background: {entry.label?.colour || 'transparent'}"
							/>

							{#if entry.title}
								{entry.title}
							{:else}
								<span class="entry-preview">{entry.entry}...</span>
							{/if}
						</a>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>

<style lang="less">
	@import '../../styles/variables.less';

	@width: 300px;

	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		min-width: @width;
		max-width: max(30%, @width);
		height: 100%;
		background-color: @header-bg;
		z-index: 100;
		transform: translateX(-100%);
		transition: transform 0.3s ease;
		border-right: 2px solid @border-heavy;
		overflow-y: scroll;

		&.showing {
			transform: translateX(0);
		}

		.header {
			padding: 0.5rem;
			display: flex;
			justify-content: right;
			align-content: center;
			position: sticky;
			top: 0;
			background: linear-gradient(180deg, @light-accent, transparent);
		}
	}

	.day {
		margin: 0.6rem 0 0.9em 0;
		border-bottom: 2px solid @border-heavy;

		&:last-child {
			border-bottom: none;
		}
		p {
			font-size: 0.9rem;
			margin: 0;
			padding: 0;
		}

		h2 {
			font-size: 1rem;
			padding: 0;
			margin: 0.5em 0 0.5em 2em;
		}

		.entry {
			display: grid;
			grid-template-columns: 65px 18px 1fr;
			padding: 2px 0;
			align-items: center;
			color: @text-color;

			&:after {
				display: none;
			}

			&:hover {
				background-color: @light-accent;
			}

			.entry-time {
				font-size: 0.7rem;
				color: @text-color-light;
				width: 100%;
				text-align: center;
			}

			.entry-preview {
				color: @text-color-light;
			}
		}
	}
</style>
