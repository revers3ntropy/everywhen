<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnOwogICAgaW1wb3J0IERlbGV0ZSBmcm9tICdzdmVsdGUtbWF0ZXJpYWwtaWNvbnMvRGVsZXRlLnN2ZWx0ZSc7CiAgICBpbXBvcnQgeyBnZXROb3RpZmljYXRpb25zQ29udGV4dCB9IGZyb20gJ3N2ZWx0ZS1ub3RpZmljYXRpb25zJzsKICAgIGltcG9ydCB0eXBlIHsgQXV0aCB9IGZyb20gJy4uLy4uL2xpYi9jb250cm9sbGVycy91c2VyJzsKICAgIGltcG9ydCB7IGFwaSwgYXBpUGF0aCB9IGZyb20gJy4uLy4uL2xpYi91dGlscy9hcGlSZXF1ZXN0JzsKICAgIGltcG9ydCB7IGRpc3BsYXlOb3RpZk9uRXJyIH0gZnJvbSAnLi4vLi4vbGliL3V0aWxzL25vdGlmaWNhdGlvbnMnOwogICAgaW1wb3J0IHsgc2hvd1BvcHVwIH0gZnJvbSAnLi4vLi4vbGliL3V0aWxzL3BvcHVwcyc7CiAgICBpbXBvcnQgRGVsZXRlTGFiZWxEaWFsb2cgZnJvbSAnLi9EZWxldGVMYWJlbERpYWxvZy5zdmVsdGUnOwoKICAgIGNvbnN0IHsgYWRkTm90aWZpY2F0aW9uIH0gPSBnZXROb3RpZmljYXRpb25zQ29udGV4dCgpOwoKICAgIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCk7CgogICAgZXhwb3J0IGxldCBhdXRoOiBBdXRoOwogICAgZXhwb3J0IGxldCBuYW1lOiBzdHJpbmc7CiAgICBleHBvcnQgbGV0IGNvbG91cjogc3RyaW5nOwogICAgZXhwb3J0IGxldCBpZDogc3RyaW5nOwogICAgZXhwb3J0IGxldCBlZGl0YWJsZSA9IHRydWU7CiAgICBleHBvcnQgbGV0IGNyZWF0ZWQ6IG51bWJlcjsKICAgIGV4cG9ydCBsZXQgZW50cnlDb3VudDogbnVtYmVyOwogICAgZXhwb3J0IGxldCBldmVudENvdW50OiBudW1iZXI7CgogICAgbGV0IGRlbGV0ZWQgPSBmYWxzZTsKCiAgICBhc3luYyBmdW5jdGlvbiB1cGRhdGVMYWJlbCAoY2hhbmdlczogeyBuYW1lPzogc3RyaW5nOyBjb2xvdXI/OiBzdHJpbmcgfSkgewogICAgICAgIGRpc3BsYXlOb3RpZk9uRXJyKAogICAgICAgICAgICBhZGROb3RpZmljYXRpb24sCiAgICAgICAgICAgIGF3YWl0IGFwaS5wdXQoYXV0aCwgYXBpUGF0aChgL2xhYmVscy8/YCwgaWQpLCBjaGFuZ2VzKSwKICAgICAgICApOwogICAgfQoKICAgIGFzeW5jIGZ1bmN0aW9uIGRlbGV0ZUxhYmVsICgpIHsKICAgICAgICAvLyBpZiB0aGVyZSBhcmUgbm8gZW50cmllcyBvciBldmVudHMgdGllZCB0byB0aGlzCiAgICAgICAgLy8gbGFiZWwsIGRlbGV0aW5nIGl0IGVhc3ksIGJ1dCBpZiB0aGVyZSBhcmUgdGhlbgogICAgICAgIC8vIGEgbW9yZSBjb21wbGV4IG,FwcHJvYWNoIGlzIHJlcXVpcmVkIHRvIGNsZWFyIHRoZQogICAgICAgIC8vIGxhYmVsIGZyb20gdGhlIGVudHJpZXMgYW5kIGV2ZW50cwogICAgICAgIGlmIChlbnRyeUNvdW50ICsgZXZlbnRDb3VudCA8IDEpIHsKICAgICAgICAgICAgZGlzcGxheU5vdGlmT25FcnIoCiAgICAgICAgICAgICAgICBhZGROb3RpZmljYXRpb24sCiAgICAgICAgICAgICAgICBhd2FpdCBhcGkuZGVsZXRlKGF1dGgsIGFwaVBhdGgoYC9sYWJlbHMvP2AsIGlkKSksCiAgICAgICAgICAgICk7CiAgICAgICAgICAgIGRpc3BhdGNoKCdkZWxldGUnLCB7IGlkIH0pOwogICAgICAgICAgICByZXR1cm47CiAgICAgICAgfQoKICAgICAgICBzaG93UG9wdXAoRGVsZXRlTGFiZWxEaWFsb2csIHsKICAgICAgICAgICAgYXV0aCwKICAgICAgICAgICAgaWQsCiAgICAgICAgICAgIGNvbG91ciwKICAgICAgICAgICAgbmFtZQogICAgICAgIH0pOwogICAgfQo=">{}</script>

{#if !deleted}
    <div class="label {editable ? 'editable' : ''}">
        {#if editable}
            <input
                type="color"
                bind:value="{colour}"
                on:change="{() => updateLabel({ colour })}"
            />
            <input
                bind:value="{name}"
                class="editable-text"
                autocomplete="none"
                type="text"
                on:change="{() => updateLabel({ name })}"
            />
        {:else}
            <div class="entry-label-colour" style="background: {colour}"></div>
            <div>{name}</div>
        {/if}
        <a href="/labels/{id}">
            {entryCount}
            {entryCount === 1 ? 'entry' : 'entries'}
            {#if eventCount > 0},
                {eventCount}
                {eventCount === 1 ? 'event' : 'events'}
            {/if}
        </a>
        <div>
            <button on:click="{deleteLabel}" class="icon-button">
                <Delete size="30" />
            </button>
        </div>
    </div>
{/if}

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzJzsKCiAgICAubGFiZWwgewogICAgICAgIG1hcmdpbjogMC41ZW07CiAgICAgICAgZGlzcGxheTogZ3JpZDsKICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDI1cHggMWZyIDFmciAzNXB4OwogICAgICAgIGp1c3RpZnktY29udGVudDogbGVmdDsKICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyOwoKICAgICAgICAmLmVkaXRhYmxlIHsKICAgICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiA2MHB4IDFmciAxZnIgMzVweDsKICAgICAgICB9CgogICAgICAgIEBtZWRpYSBAbW9iaWxlIHsKICAgICAgICAgICAgbWF4LXdpZHRoOiAxMDB2dzsKICAgICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxNXB4IDFmciAxZnIgMzVweDsKCiAgICAgICAgICAgIGlucHV0W3R5cGU9J3RleHQnXSB7CiAgICAgICAgICAgICAgICB3aWR0aDogMTAwJTsKICAgICAgICAgICAgfQoKICAgICAgICAgICAgYSB7CiAgICAgICAgICAgICAgICBvdmVyZmxvdy13cmFwOiBicmVhay13b3JkOwogICAgICAgICAgICB9CiAgICAgICAgfQogICAgfQo="></style>