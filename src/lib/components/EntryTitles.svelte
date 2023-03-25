<script lang="ts">
	import moment from 'moment';
	import Time from 'svelte-time';
	import { Entry } from '../controllers/entry';
	import { nowS } from '../utils/time';

	export let titles: Record<number, Entry[]>;
</script>

<div>
	{#each Object.keys(titles)
		.sort((a, b) => parseInt(b) - parseInt(a)) as day}
		<div class="day">
			<h2>
				<Time
					format="dddd DD/MM/YY"
					timestamp={new Date(parseInt(day) * 1000)}
				/>
				<span class="text-light">
					{#if nowS() - parseInt(day) < 8.64e4}
						Today
					{:else if nowS() - parseInt(day) < 2 * 8.64e4}
						Yesterday
					{:else}
						<Time relative
							  timestamp={new Date(
									parseInt(day) * 1000 + (
										60 * 60 * 23 + 60 * 60 + 59
									) * 1000
								)}
							  class="text-light"
						/>
					{/if}
				</span>
			</h2>

			{#each titles[parseInt(day)] as entry}
				<a class="entry" href="/diary/{entry.id}">
					<span class="entry-time">
						{moment(new Date(entry.created * 1000))
							.format('h:mm A')}
					</span>
					<span
						class="entry-label-colour"
						style="background: {entry.label?.colour || 'transparent'}"
					></span>

					{#if entry.title}
						{entry.title}
					{:else}
						<span class="entry-preview">
							{entry.entry}
							{#if entry.entry.length >= Entry.TITLE_CUTOFF}
								...
							{/if}
						</span>
					{/if}
				</a>
			{/each}
		</div>
	{/each}

	{#if Object.keys(titles).length === 0}
		<div class="day">
			<h2>
				No entries yet
			</h2>
		</div>
	{/if}
</div>

<style lang="less">
	@import '../../styles/variables.less';

	.day {
		margin: 0.6rem 0 0.9em 0;

		&:last-child {
			border-bottom: none;
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
				font-style: italic;
			}
		}
	}
</style>
