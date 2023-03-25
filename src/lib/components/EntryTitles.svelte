<script lang="ts">
	// @ts-ignore
	import { tooltip } from '@svelte-plugins/tooltips';
	import moment from 'moment';
	import Eye from 'svelte-material-icons/Eye.svelte';
	import EyeOff from 'svelte-material-icons/EyeOff.svelte';
	import Time from 'svelte-time';
	import { Entry } from '../controllers/entry';
	import { obfuscate } from '../utils/text';
	import { nowS } from '../utils/time';

	export let titles: Record<number, Entry[]>;
	export let obfuscated = true;
</script>

<div>
	<div class="menu">
		<button
			aria-label={obfuscated ? 'Show entry' : 'Hide entry'}
			on:click={() => obfuscated = !obfuscated}
		>
			{#if obfuscated}
				<Eye size="25" />
			{:else}
				<EyeOff size="25" />
			{/if}
		</button>
	</div>

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
						use:tooltip={{ content: entry.label?.name }}
					></span>

					<div class="title {obfuscated ? 'obfuscated' : ''}">
						{#if entry.title}
							{obfuscated ? obfuscate(entry.title) : entry.title}
						{:else}
						<span class="entry-preview">
							{obfuscated ? obfuscate(entry.entry) : entry.entry}
							{#if entry.entry.length >= Entry.TITLE_CUTOFF}
								...
							{/if}
						</span>
						{/if}
					</div>
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

	.menu {
		display: flex;
		justify-content: flex-end;
		margin: 0.5rem 0;
	}

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
