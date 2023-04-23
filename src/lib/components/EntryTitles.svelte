<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyB0b29sdGlwIH0gZnJvbSAnQHN2ZWx0ZS1wbHVnaW5zL3Rvb2x0aXBzJzsKICAgIGltcG9ydCBFeWUgZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL0V5ZS5zdmVsdGUnOwogICAgaW1wb3J0IEV5ZU9mZiBmcm9tICdzdmVsdGUtbWF0ZXJpYWwtaWNvbnMvRXllT2ZmLnN2ZWx0ZSc7CiAgICBpbXBvcnQgeyBFbnRyeSB9IGZyb20gJy4uL2NvbnRyb2xsZXJzL2VudHJ5JzsKICAgIGltcG9ydCB0eXBlIHsgQXV0aCB9IGZyb20gJy4uL2NvbnRyb2xsZXJzL3VzZXInOwogICAgaW1wb3J0IHsgc2hvd1BvcHVwIH0gZnJvbSAnLi4vdXRpbHMvcG9wdXBzJzsKICAgIGltcG9ydCB7IG9iZnVzY2F0ZSB9IGZyb20gJy4uL3V0aWxzL3RleHQnOwogICAgaW1wb3J0IHsgbm93UywgdXRjRXEgfSBmcm9tICcuLi91dGlscy90aW1lJzsKICAgIGltcG9ydCBFbnRyeURpYWxvZyBmcm9tICcuL2RpYWxvZ3MvRW50cnlEaWFsb2cuc3ZlbHRlJzsKICAgIGltcG9ydCBEb3QgZnJvbSAnLi9Eb3Quc3ZlbHRlJzsKICAgIGltcG9ydCBVdGNUaW1lIGZyb20gJy4vVXRjVGltZS5zdmVsdGUnOwoKICAgIGV4cG9ydCBsZXQgdGl0bGVzOiBSZWNvcmQ8bnVtYmVyLCBFbnRyeVtdPjsKICAgIGV4cG9ydCBsZXQgb2JmdXNjYXRlZCA9IHRydWU7CiAgICBleHBvcnQgbGV0IHNob3dUaW1lQWdvID0gdHJ1ZTsKICAgIGV4cG9ydCBsZXQgYXV0aDogQXV0aDsKICAgIGV4cG9ydCBsZXQgYmx1clRvZ2dsZU9uTGVmdCA9IGZhbHNlOwogICAgZXhwb3J0IGxldCBoaWRlQmx1clRvZ2dsZSA9IGZhbHNlOwoKICAgIGZ1bmN0aW9uIHNob3dFbnRyeVBvcHVwIChlbnRyeUlkOiBzdHJpbmcpIHsKICAgICAgICBzaG93UG9wdXAoRW50cnlEaWFsb2csIHsKICAgICAgICAgICAgaWQ6IGVudHJ5SWQsCiAgICAgICAgICAgIGF1dGgsCiAgICAgICAgICAgIG9iZnVzY2F0ZWQsCiAgICAgICAgfSk7CiAgICB9Cg==">{}</script>

<div>
    {#if !hideBlurToggle}
        <div class="menu {blurToggleOnLeft ? 'left' : ''}">
            <button
                aria-label="{obfuscated ? 'Show entries' : 'Hide entries'}"
                on:click="{() => (obfuscated = !obfuscated)}"
            >
                {#if obfuscated}
                    <Eye size="25" />
                {:else}
                    <EyeOff size="25" />
                {/if}
            </button>
        </div>
    {/if}

    {#each Object.keys(titles).sort((a, b) => parseInt(b) - parseInt(a)) as day}
        <div class="day">
            <h2>
                <UtcTime
                    timestamp="{parseInt(day)}"
                    fmt="dddd DD/MM/YY"
                    noTooltip="{true}"
                />
                {#if showTimeAgo}
                    <Dot />
                    <span class="text-light">
                        {#if utcEq(nowS(), parseInt(day))}
                            <span>Today</span>
                        {:else if utcEq(nowS() - 60 * 60 * 24, parseInt(day))}
                            <span>Yesterday</span>
                        {:else}
                            <UtcTime
                                relative
                                timestamp="{parseInt(day)}"
                                noTooltip="{true}"
                            />
                        {/if}
                    </span>
                {/if}
            </h2>

            {#each titles[parseInt(day)] as entry}
                <button
                    class="entry"
                    on:click="{() => showEntryPopup(entry.id)}"
                >
                    <span class="entry-time">
                        <UtcTime
                            timestamp="{entry.created}"
                            fmt="h:mm A"
                            tzOffset="{entry.createdTZOffset}"
                            tooltipPosition="right"
                        />
                    </span>
                    {#if entry.label}
                        <span
                            class="entry-label-colour"
                            style="background: {entry.label?.colour ||
                                'transparent'}"
                            use:tooltip="{{ content: entry.label?.name }}"
                        ></span>
                    {:else}
                        <span class="entry-label-colour"></span>
                    {/if}

                    <span class="title {obfuscated ? 'obfuscated' : ''}">
                        {#if entry.title}
                            {obfuscated ? obfuscate(entry.title) : entry.title}
                        {:else}
                            <span class="entry-preview">
                                {obfuscated
                                    ? obfuscate(entry.entry)
                                    : entry.entry}
                                {#if entry.entry.length >= Entry.TITLE_CUTOFF}
                                    ...
                                {/if}
                            </span>
                        {/if}
                    </span>
                </button>
            {/each}
        </div>
    {/each}

    {#if Object.keys(titles).length === 0}
        <div class="day">
            <h2>No entries yet</h2>
        </div>
    {/if}
</div>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzJzsKCiAgICAubWVudSB7CiAgICAgICAgZGlzcGxheTogZmxleDsKICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kOwogICAgICAgIG1hcmdpbjogMC41cmVtIDA7CgogICAgICAgICYubGVmdCB7CiAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDsKICAgICAgICB9CiAgICB9CgogICAgLmRheSB7CiAgICAgICAgbWFyZ2luOiAwLjZyZW0gMCAwLjllbSAwOwoKICAgICAgICAmOmxhc3QtY2hpbGQgewogICAgICAgICAgICBib3JkZXItYm90dG9tOiBub25lOwogICAgICAgIH0KCiAgICAgICAgaDIgewogICAgICAgICAgICBmb250LXNpemU6IDFyZW07CiAgICAgICAgICAgIHBhZGRpbmc6IDA7CiAgICAgICAgICAgIG1hcmdpbjogMC41ZW0gMCAwLjVlbSAyZW07CiAgICAgICAgfQoKICAgICAgICAuZW50cnkgewogICAgICAgICAgICBkaXNwbGF5OiBncmlkOwogICAgICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDY1cHggMThweCAxZnI7CiAgICAgICAgICAgIHBhZGRpbmc6IDJweCAycHg7CiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7CiAgICAgICAgICAgIGNvbG9yOiBAdGV4dC1jb2xvcjsKICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMnB4OwogICAgICAgICAgICB3aWR0aDogMTAwJTsKICAgICAgICAgICAgdGV4dC1hbGlnbjogbGVmdDsKCiAgICAgICAgICAgICY6YWZ0ZXIgewogICAgICAgICAgICAgICAgZGlzcGxheTogbm9uZTsKICAgICAgICAgICAgfQoKICAgICAgICAgICAgJjpob3ZlciB7CiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiBAbGlnaHQtYWNjZW50OwogICAgICAgICAgICB9CgogICAgICAgICAgICAuZW50cnktdGltZSB7CiAgICAgICAgICAgICAgICBmb250LXNpemU6IDAuN3JlbTsKICAgICAgICAgICAgICAgIGNvbG9yOiBAdGV4dC1jb2xvci1saWdodDsKICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlOwogICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyOwogICAgICAgICAgICB9CgogICAgICAgICAgICAuZW50cnktcHJldmlldyB7CiAgICAgICAgICAgICAgICBjb2xvcjogQHRleHQtY29sb3ItbGlnaHQ7CiAgICAgICAgICAgICAgICBmb250LXN0eWxlOiBpdGFsaWM7CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9Cg=="></style>