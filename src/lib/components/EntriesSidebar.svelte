<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgQ2xvc2UgZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL0Nsb3NlLnN2ZWx0ZSc7CiAgICBpbXBvcnQgRXllIGZyb20gJ3N2ZWx0ZS1tYXRlcmlhbC1pY29ucy9FeWUuc3ZlbHRlJzsKICAgIGltcG9ydCBFeWVPZmYgZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL0V5ZU9mZi5zdmVsdGUnOwogICAgaW1wb3J0IE1lbnUgZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL01lbnUuc3ZlbHRlJzsKICAgIGltcG9ydCB7IGZseSB9IGZyb20gJ3N2ZWx0ZS90cmFuc2l0aW9uJzsKICAgIGltcG9ydCB7IEFOSU1BVElPTl9EVVJBVElPTiB9IGZyb20gJy4uL2NvbnN0YW50cyc7CiAgICBpbXBvcnQgdHlwZSB7IEVudHJ5IH0gZnJvbSAnLi4vY29udHJvbGxlcnMvZW50cnknOwogICAgaW1wb3J0IHR5cGUgeyBBdXRoIH0gZnJvbSAnLi4vY29udHJvbGxlcnMvdXNlcic7CiAgICBpbXBvcnQgRW50cnlUaXRsZXMgZnJvbSAnLi9FbnRyeVRpdGxlcy5zdmVsdGUnOwoKICAgIGV4cG9ydCBsZXQgdGl0bGVzOiBSZWNvcmQ8bnVtYmVyLCBFbnRyeVtdPjsKICAgIGV4cG9ydCBsZXQgYXV0aDogQXV0aDsKCiAgICBsZXQgc2hvd2luZyA9IGZhbHNlOwogICAgbGV0IG9iZnVzY2F0ZWQgPSBmYWxzZTsK">{}</script>

<div>
    <div class="floating-button">
        <button
            aria-label="Show sidebar menu"
            on:click="{() => (showing = !showing)}"
        >
            <Menu size="40" />
        </button>
    </div>
    {#if showing}
        <div
            class="sidebar"
            transition:fly="{{
                duration: ANIMATION_DURATION,
                x: -200
            }}"
        >
            <div class="header">
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
                <button
                    aria-label="Close sidebar menu"
                    on:click="{() => (showing = !showing)}"
                >
                    <Close size="30" />
                </button>
            </div>
            <div class="content">
                <EntryTitles
                    auth="{auth}"
                    obfuscated="{obfuscated}"
                    titles="{titles}"
                    hideBlurToggle
                />
            </div>
        </div>
    {/if}
</div>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzJzsKCiAgICBAd2lkdGg6IDMwMHB4OwoKICAgIC5zaWRlYmFyIHsKICAgICAgICBwb3NpdGlvbjogZml4ZWQ7CiAgICAgICAgdG9wOiAwOwogICAgICAgIGxlZnQ6IDA7CiAgICAgICAgbWluLXdpZHRoOiBAd2lkdGg7CiAgICAgICAgaGVpZ2h0OiAxMDAlOwogICAgICAgIGJhY2tncm91bmQtY29sb3I6IEBoZWFkZXItYmc7CiAgICAgICAgei1pbmRleDogMTA7CiAgICAgICAgYm9yZGVyLXJpZ2h0OiAycHggc29saWQgQGJvcmRlci1oZWF2eTsKICAgICAgICBvdmVyZmxvdy15OiBzY3JvbGw7CiAgICAgICAgcGFkZGluZzogMDsKCiAgICAgICAgLmhlYWRlciB7CiAgICAgICAgICAgIHBhZGRpbmc6IDAuNXJlbTsKICAgICAgICAgICAgZGlzcGxheTogZmxleDsKICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiByaWdodDsKICAgICAgICAgICAgYWxpZ24tY29udGVudDogY2VudGVyOwogICAgICAgICAgICBwb3NpdGlvbjogc3RpY2t5OwogICAgICAgICAgICB0b3A6IDA7CiAgICAgICAgfQogICAgfQo="></style>