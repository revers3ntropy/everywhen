<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyB0b29sdGlwIH0gZnJvbSAnQHN2ZWx0ZS1wbHVnaW5zL3Rvb2x0aXBzJzsKICAgIGltcG9ydCB7IG9uTW91bnQgfSBmcm9tICdzdmVsdGUnOwogICAgaW1wb3J0IEFwcGxlIGZyb20gJ3N2ZWx0ZS1tYXRlcmlhbC1pY29ucy9BcHBsZS5zdmVsdGUnOwogICAgaW1wb3J0IENlbGxwaG9uZSBmcm9tICdzdmVsdGUtbWF0ZXJpYWwtaWNvbnMvQ2VsbHBob25lLnN2ZWx0ZSc7CiAgICBpbXBvcnQgTGludXggZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL0xpbnV4LnN2ZWx0ZSc7CiAgICBpbXBvcnQgV2luZG93cyBmcm9tICdzdmVsdGUtbWF0ZXJpYWwtaWNvbnMvTWljcm9zb2Z0V2luZG93cy5zdmVsdGUnOwogICAgaW1wb3J0IFRlbGV2aXNpb24gZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL1RlbGV2aXNpb24uc3ZlbHRlJzsKICAgIGltcG9ydCBXYXRjaCBmcm9tICdzdmVsdGUtbWF0ZXJpYWwtaWNvbnMvV2F0Y2guc3ZlbHRlJzsKICAgIGltcG9ydCBVQVBhcnNlciBmcm9tICd1YS1wYXJzZXItanMnOwogICAgaW1wb3J0IHR5cGUgeyBQaXhlbHMgfSBmcm9tICcuLi91dGlscy90eXBlcyc7CgogICAgY29uc3QgbW9iaWxlT1NzID0gWwogICAgICAgICdBbmRyb2lkJywKICAgICAgICAnQW5kcm9pZC14ODYnLAogICAgICAgICdCbGFja0JlcnJ5JywKICAgICAgICAnaU9TJywKICAgICAgICAnV2luZG93cyBQaG9uZScsCiAgICAgICAgJ1dpbmRvd3MgTW9iaWxlJywKICAgICAgICAnUGFsbScsCiAgICBdOwogICAgY29uc3Qgd2F0Y2hPU3MgPSBbICd3YXRjaE9TJyBdOwogICAgY29uc3QgdHZPU3MgPSBbICd0dk9TJywgJ05ldFRWJyBdOwogICAgY29uc3QgY29uc29sZU9TcyA9IFsgJ1BsYXlTdGF0aW9uJywgJ1hib3gnIF07CiAgICBjb25zdCBtYWNPU3MgPSBbICdNYWMgT1MnIF07CiAgICBjb25zdCB3aW5kb3dzT1NzID0gWyAnV2luZG93cycgXTsKCiAgICBleHBvcnQgbGV0IGRhdGEgPSAnJzsKICAgIGV4cG9ydCBsZXQgc2l6ZTogUGl4ZWxzID0gMjA7CgogICAgbGV0IHBhcnNlZDogdW5rbm93biA9IHt9OwogICAgbGV0IHVhID0gbnVsbCBhcyBSZXR1cm5UeXBlPHR5cGVvZiBVQVBhcnNlcj4gfCBudWxsOwoKICAgIG9uTW91bnQoKCkgPT4gewogICAgICAgIGlmICghZGF0YSkgcmV0dXJuOwoKICAgICAgICB0cnkgewogICAgICAgICAgICBwYXJzZWQgPSBKU09OLnBhcnNlKGRhdGEpOwogICAgICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgICAgICAgLyogZW1wdHkgKi8KICAgICAgICB9CgogICAgICAgIGlmICh0eXBlb2YgcGFyc2VkICE9PSAnb2JqZWN0JyB8fCBwYXJzZWQgPT09IG51bGwpIHJldHVybjsKICAgICAgICBpZiAoISgndXNlckFnZW50JyBpbiBwYXJzZWQpKSByZXR1cm47CiAgICAgICAgaWYgKHR5cGVvZiBwYXJzZWQudXNlckFnZW50ICE9PSAnc3RyaW5nJykgcmV0dXJuOwogICAgICAgIHVhID0gbmV3IFVBUGFyc2VyKHBhcnNlZC51c2VyQWdlbnQpLmdldFJlc3VsdCgpOwogICAgfSk7CgogICAgJDogb3NOYW1lID0gdWEgIT09IG51bGwgPyB1YT8ub3M/Lm5hbWUgfHwgJ1Vua25vd24gT1MnIDogJyc7Cg==">{}</script>

{#if ua}
    <span
        use:tooltip="{{
            content: `Created on ${osName}`
        }}"
    >
        {#if mobileOSs.includes(osName)}
            <Cellphone size="{size}" />
        {:else if watchOSs.includes(osName)}
            <Watch size="{size}" />
        {:else if tvOSs.includes(osName)}
            <Television size="{size}" />
        {:else if consoleOSs.includes(osName)}
            <Television size="{size}" />
        {:else if macOSs.includes(osName)}
            <Apple size="{size}" />
        {:else if windowsOSs.includes(osName)}
            <Windows size="{size}" />
        {:else}
            <Linux size="{size}" />
        {/if}
    </span>
{/if}

<style lang="less" ✂prettier:content✂="CiAgICBzcGFuIHsKICAgICAgICBtYXJnaW46IDAuNXJlbTsKICAgIH0K"></style>