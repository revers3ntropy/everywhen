<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJzsKICAgIGltcG9ydCBEb3QgZnJvbSAnLi4vLi4vLi4vbGliL2NvbXBvbmVudHMvRG90LnN2ZWx0ZSc7CiAgICBpbXBvcnQgdHlwZSB7IEVudHJ5IH0gZnJvbSAnLi4vLi4vY29udHJvbGxlcnMvZW50cnknOwogICAgaW1wb3J0IHR5cGUgeyBBdXRoIH0gZnJvbSAnLi4vLi4vY29udHJvbGxlcnMvdXNlcic7CiAgICBpbXBvcnQgeyBhcGksIGFwaVBhdGggfSBmcm9tICcuLi8uLi91dGlscy9hcGlSZXF1ZXN0JzsKICAgIGltcG9ydCBVdGNUaW1lIGZyb20gJy4uL1V0Y1RpbWUuc3ZlbHRlJzsKCiAgICBleHBvcnQgbGV0IGlkOiBzdHJpbmc7CiAgICBleHBvcnQgbGV0IGF1dGg6IEF1dGg7CiAgICBleHBvcnQgbGV0IGVudHJ5OiBFbnRyeSB8IG51bGwgPSBudWxsOwogICAgbGV0IGVycm9yOiBzdHJpbmcgfCBudWxsID0gbnVsbDsKCiAgICBhc3luYyBmdW5jdGlvbiBnZXRFbnRyeSAoKSB7CiAgICAgICAgaWYgKGVudHJ5KSByZXR1cm47CgogICAgICAgIGNvbnN0IHsgZXJyLCB2YWwgfSA9IGF3YWl0IGFwaS5nZXQoYXV0aCwgYXBpUGF0aCgnL2VudHJpZXMvPycsIGlkKSk7CiAgICAgICAgaWYgKGVycikgewogICAgICAgICAgICBlcnJvciA9IGVycjsKICAgICAgICAgICAgcmV0dXJuOwogICAgICAgIH0KICAgICAgICBlbnRyeSA9IHZhbDsKICAgIH0KCiAgICBvbk1vdW50KGdldEVudHJ5KTsK">{}</script>

<div class="wrapper">
    {#if entry}
        <div class="datetime">
            <UtcTime
                timestamp="{entry.created}"
                fmt="ddd Do MMMM YYYY, h:mm a"
                noTooltip="{true}"
            />
            <Dot />
            <UtcTime
                timestamp="{entry.created}"
                relative="{true}"
                noTooltip="{true}"
            />
        </div>
        {#if entry.title}
            <h1>{entry.title}</h1>
        {/if}
        <p>{entry.entry}</p>
    {:else if error}
        <p>{error}</p>
    {:else}
        <p>Loading...</p>
    {/if}
</div>

<style lang="less" ✂prettier:content✂="CiAgICAud3JhcHBlciB7CiAgICAgICAgbWluLXdpZHRoOiAyMDBweDsKICAgICAgICBtYXgtd2lkdGg6IG1pbig0MHZ3LCA3MDBweCk7CiAgICB9CgogICAgLmRhdGV0aW1lIHsKICAgICAgICA6Z2xvYmFsKCopIHsKICAgICAgICAgICAgZm9udC1zaXplOiAwLjlyZW07CiAgICAgICAgICAgIGNvbG9yOiAjNDQ0ICFpbXBvcnRhbnQ7CiAgICAgICAgfQogICAgfQo="></style>