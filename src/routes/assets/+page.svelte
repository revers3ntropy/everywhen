<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgSW1hZ2VPdXRsaW5lIGZyb20gJ3N2ZWx0ZS1tYXRlcmlhbC1pY29ucy9JbWFnZU91dGxpbmUuc3ZlbHRlJzsKICAgIGltcG9ydCBEb3QgZnJvbSAnLi4vLi4vbGliL2NvbXBvbmVudHMvRG90LnN2ZWx0ZSc7CiAgICBpbXBvcnQgdHlwZSB7IEFzc2V0IGFzIEFzc2V0Q29udHJvbGxlciB9IGZyb20gJy4uLy4uL2xpYi9jb250cm9sbGVycy9hc3NldCc7CiAgICBpbXBvcnQgeyBvYmZ1c2NhdGVkIH0gZnJvbSAnLi4vLi4vbGliL3N0b3Jlcyc7CiAgICBpbXBvcnQgQXNzZXQgZnJvbSAnLi9Bc3NldC5zdmVsdGUnOwoKICAgIGV4cG9ydCBsZXQgZGF0YTogQXBwLlBhZ2VEYXRhICYgewogICAgICAgIGFzc2V0czogT21pdDxBc3NldENvbnRyb2xsZXIsICdjb250ZW50Jz5bXTsKICAgIH07CgogICAgbGV0IG51bUFzc2V0cyA9IGRhdGEuYXNzZXRzLmxlbmd0aDsK">{}</script>

<main>
    <h1>
        <ImageOutline size="40" />
        <span>Gallery</span>
        {#if numAssets > 0}
            <Dot />
            {numAssets}
        {/if}
    </h1>
    <div class="assets">
        {#each data.assets as asset}
            <Asset
                {...asset}
                auth="{data}"
                on:delete="{() => numAssets--}"
                obfuscated="{$obfuscated}"
            />
        {/each}
    </div>
    {#if numAssets === 0}
        <div class="flex-center">
            <i>No images yet</i>
        </div>
    {/if}
</main>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzJzsKICAgIEBpbXBvcnQgJy4uLy4uL3N0eWxlcy9sYXlvdXQnOwoKICAgIGgxIHsKICAgICAgICAuZmxleC1jZW50ZXIoKTsKICAgICAgICBtYXJnaW46IDA7CiAgICAgICAgZm9udC1zaXplOiA0MHB4OwoKICAgICAgICBpIHsKICAgICAgICAgICAgZm9udC1zaXplOiAwLjVlbTsKICAgICAgICAgICAgbWFyZ2luLWxlZnQ6IDAuNWVtOwogICAgICAgIH0KCiAgICAgICAgc3BhbiB7CiAgICAgICAgICAgIG1hcmdpbi1sZWZ0OiAwLjJlbTsKICAgICAgICB9CiAgICB9CgogICAgLmFzc2V0cyB7CiAgICAgICAgZGlzcGxheTogZmxleDsKICAgICAgICBmbGV4LXdyYXA6IHdyYXA7CiAgICB9Cg=="></style>