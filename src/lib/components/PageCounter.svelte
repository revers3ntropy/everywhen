<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgQXJyb3dMZWZ0IGZyb20gJ3N2ZWx0ZS1tYXRlcmlhbC1pY29ucy9BcnJvd0xlZnQuc3ZlbHRlJzsKICAgIGltcG9ydCBBcnJvd1JpZ2h0IGZyb20gJ3N2ZWx0ZS1tYXRlcmlhbC1pY29ucy9BcnJvd1JpZ2h0LnN2ZWx0ZSc7CgogICAgZXhwb3J0IGxldCBwYWdlID0gMDsKICAgIGV4cG9ydCBsZXQgcGFnZXMgPSAwOwogICAgZXhwb3J0IGxldCBwYWdlTGVuZ3RoID0gMDsKICAgIGV4cG9ydCBsZXQgdG90YWwgPSAwOwogICAgZXhwb3J0IGxldCBlbXB0eVRleHQgPSAnJzsK">{}</script>

{#if total < 1}
    {emptyText}
{:else}
    <div class="page-counter">
        <div>
            <button
                on:click="{() => page--}"
                disabled="{page <= 0}"
                class="flex-center"
                aria-label="Previous page"
            >
                <ArrowLeft size="20" />
            </button>
        </div>
        <div>
            Page {page + 1} of {pages}
            <span class="totals">
                (showing {Math.min((page + 1) * pageLength, total)} / {total})
            </span>
        </div>
        <div>
            <button
                on:click="{() => page++}"
                disabled="{page >= pages - 1}"
                class="flex-center"
                aria-label="Next page"
            >
                <ArrowRight size="20" />
            </button>
        </div>
    </div>
{/if}

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzLmxlc3MnOwoKICAgIC5wYWdlLWNvdW50ZXIgewogICAgICAgIGRpc3BsYXk6IGZsZXg7CiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7CiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjsKICAgIH0KCiAgICAudG90YWxzIHsKICAgICAgICBjb2xvcjogQHRleHQtY29sb3ItbGlnaHQ7CiAgICB9Cg=="></style>