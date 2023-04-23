<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyB0b29sdGlwIGFzIHVzZVRvb2x0aXAgfSBmcm9tICdAc3ZlbHRlLXBsdWdpbnMvdG9vbHRpcHMnOwoKICAgIGV4cG9ydCBsZXQgdmFsdWU6IG51bWJlciB8IHN0cmluZzsKICAgIGV4cG9ydCBsZXQgYmVmb3JlTGFiZWwgPSAnJzsKICAgIGV4cG9ydCBsZXQgbGFiZWw6IHN0cmluZzsKICAgIGV4cG9ydCBsZXQgcHJpbWFyeSA9IGZhbHNlOwogICAgZXhwb3J0IGxldCB0b29sdGlwID0gJyc7Cg==">{}</script>

{#if tooltip}
    <div
        class="{primary ? 'primary' : ''}"
        use:useTooltip="{{ content: tooltip }}"
    >
        {beforeLabel}
        <span>{value}</span>
        {label}
    </div>
{:else}
    <div class="{primary ? 'primary' : ''}">
        {beforeLabel}
        <span>{value}</span>
        {label}
    </div>
{/if}

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzJzsKICAgIEBpbXBvcnQgJy4uLy4uL3N0eWxlcy9sYXlvdXQnOwoKICAgIGRpdiB7CiAgICAgICAgYmFja2dyb3VuZDogQGxpZ2h0LWFjY2VudDsKICAgICAgICBwYWRkaW5nOiAwLjNyZW07CiAgICAgICAgYm9yZGVyLXJhZGl1czogMC41cmVtOwogICAgICAgIG1hcmdpbjogMC41cmVtOwogICAgICAgIGZvbnQtc2l6ZTogMC45cmVtOwoKICAgICAgICBzcGFuIHsKICAgICAgICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7CiAgICAgICAgICAgIGZvbnQtc2l6ZTogMXJlbTsKICAgICAgICB9CgogICAgICAgICYucHJpbWFyeSB7CiAgICAgICAgICAgIGJhY2tncm91bmQ6IEBhY2NlbnQtZ3JhZGllbnQ7CiAgICAgICAgICAgIGNvbG9yOiBAdGV4dC1jb2xvci1pbnZlcnQ7CiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIEBib3JkZXItbGlnaHQ7CiAgICAgICAgICAgIC5nbG93KCk7CgogICAgICAgICAgICBzcGFuIHsKICAgICAgICAgICAgICAgIGNvbG9yOiBAdGV4dC1jb2xvci1pbnZlcnQ7CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9Cg=="></style>