<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgdHlwZSB7IExhYmVsIH0gZnJvbSAnLi4vY29udHJvbGxlcnMvbGFiZWwnOwoKICAgIGV4cG9ydCBsZXQgbGFiZWw6IExhYmVsIHwgbnVsbCA9IG51bGw7CgogICAgZXhwb3J0IGxldCBvYmZ1c2NhdGVkID0gdHJ1ZTsK">{}</script>

{#if label}
    <a class="label has-label" href="/labels/{label.id}">
        <span class="colour" style="background: {label.colour}"></span>
        <span class="name {obfuscated ? 'obfuscated' : ''}">
            {label.name}
        </span>
    </a>
{:else}
    <span style="margin: 0 .5em"></span>
{/if}

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzLmxlc3MnOwoKICAgIC5sYWJlbCB7CiAgICAgICAgbWFyZ2luOiAwLjVlbTsKICAgICAgICB3aWR0aDogZml0LWNvbnRlbnQ7CiAgICAgICAgcGFkZGluZzogNXB4OwogICAgICAgIGJvcmRlci1yYWRpdXM6IEBib3JkZXItcmFkaXVzOwogICAgICAgIGRpc3BsYXk6IGlubGluZS1ncmlkOwogICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7CiAgICAgICAgYWxpZ24tY29udGVudDogY2VudGVyOwogICAgICAgIGp1c3RpZnktaXRlbXM6IGNlbnRlcjsKICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47CiAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAyNXB4IDFmcjsKICAgICAgICBiYWNrZ3JvdW5kOiBAYm9yZGVyOwoKICAgICAgICAmOmhvdmVyIHsKICAgICAgICAgICAgYmFja2dyb3VuZDogQGFjY2VudC1jb2xvci1wcmltYXJ5OwoKICAgICAgICAgICAgKiB7CiAgICAgICAgICAgICAgICBjb2xvcjogYmxhY2s7CiAgICAgICAgICAgIH0KICAgICAgICB9CgogICAgICAgIC5uYW1lIHsKICAgICAgICAgICAgbWFyZ2luLWxlZnQ6IDVweDsKICAgICAgICB9CgogICAgICAgIC5jb2xvdXIgewogICAgICAgICAgICBoZWlnaHQ6IDIwcHg7CiAgICAgICAgICAgIHdpZHRoOiAyMHB4OwogICAgICAgICAgICBib3JkZXItcmFkaXVzOiA1MCU7CiAgICAgICAgfQogICAgfQo="></style>