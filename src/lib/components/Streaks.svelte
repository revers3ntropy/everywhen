<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyB0b29sdGlwIH0gZnJvbSAnQHN2ZWx0ZS1wbHVnaW5zL3Rvb2x0aXBzJzsKICAgIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnOwogICAgaW1wb3J0IEZpcmUgZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL0ZpcmUuc3ZlbHRlJzsKICAgIGltcG9ydCBUaW1lclNhbmQgZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL1RpbWVyU2FuZC5zdmVsdGUnOwogICAgaW1wb3J0IHR5cGUgeyBTdHJlYWtzIH0gZnJvbSAnLi4vY29udHJvbGxlcnMvZW50cnknOwogICAgaW1wb3J0IHR5cGUgeyBBdXRoIH0gZnJvbSAnLi4vY29udHJvbGxlcnMvdXNlcic7CiAgICBpbXBvcnQgeyBhcGkgfSBmcm9tICcuLi91dGlscy9hcGlSZXF1ZXN0JzsKCiAgICBleHBvcnQgbGV0IGF1dGg6IEF1dGg7CiAgICBleHBvcnQgbGV0IHRvb2x0aXBQb3NpdGlvbjogJ3RvcCcgfCAnYm90dG9tJyB8ICdsZWZ0JyB8ICdyaWdodCcgPSAnYm90dG9tJzsKCiAgICBsZXQgc3RyZWFrczogU3RyZWFrcyB8IG51bGwgPSBudWxsOwogICAgbGV0IGxvYWRlZCA9IGZhbHNlOwogICAgbGV0IGVycm9yOiBzdHJpbmcgfCBudWxsOwoKICAgIG9uTW91bnQoYXN5bmMgKCkgPT4gewogICAgICAgIGNvbnN0IHsgZXJyLCB2YWwgfSA9IGF3YWl0IGFwaS5nZXQoYXV0aCwgJy9lbnRyaWVzL3N0cmVha3MnKTsKICAgICAgICBpZiAoZXJyKSB7CiAgICAgICAgICAgIGVycm9yID0gZXJyOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIHN0cmVha3MgPSB2YWw7CiAgICAgICAgfQogICAgICAgIGxvYWRlZCA9IHRydWU7CiAgICB9KTsKCiAgICBmdW5jdGlvbiBtYWtlVG9vbHRpcCAobG9uZ2VzdDogbnVtYmVyLCBydW5uaW5nT3V0OiBib29sZWFuKTogc3RyaW5nIHsKICAgICAgICByZXR1cm4gKAogICAgICAgICAgICBgQ3VycmVudCBTdHJlYWtgICsKICAgICAgICAgICAgKGxvbmdlc3QgPiAwID8gYCAmI3gyMDIyOyA8YnI+IExvbmdlc3Q6ICR7bG9uZ2VzdH0gZGF5c2AgOiAnJykgKwogICAgICAgICAgICAocnVubmluZ091dAogICAgICAgICAgICAgICAgPyAnPGJyPiBNYWtlIGFuIGVudHJ5IHRvZGF5IHRvIGNvbnRpbnVlIHRoZSBTdHJlYWshJwogICAgICAgICAgICAgICAgOiAnJykKICAgICAgICApOwogICAgfQo=">{}</script>

{#if loaded}
    {#if error}
        <p>{error}</p>
    {:else if streaks}
        <span
            class="flex-center"
            use:tooltip="{{
                content: makeTooltip(streaks.longest, streaks.runningOut),
                position: tooltipPosition
            }}"
        >
            {#if streaks.runningOut}
                <TimerSand size="25" />
            {:else if streaks.current > 0}
                <span>
                    <Fire size="25" class="gradient-icon" />
                </span>
            {:else}
                <Fire size="25" />
            {/if}
            <b>{streaks.current}</b>
        </span>
    {/if}
{:else}
    <span
        class="flex-center"
        use:tooltip="{{
            content: '...',
            position: tooltipPosition
        }}"
    >
        <Fire size="25" />
        <b>...</b>
    </span>
{/if}