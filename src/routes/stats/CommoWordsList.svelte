<script lang="ts" ✂prettier:content✂="CiAgICBleHBvcnQgbGV0IHdvcmRzOiBbIHN0cmluZywgbnVtYmVyIF1bXTsKICAgIGV4cG9ydCBsZXQgZW50cnlDb3VudDogbnVtYmVyOwo=">{}</script>

<div class="common-words">
    {#each words as [word, count], i}
        <div>#{i + 1}</div>

        <a href="/stats/{encodeURIComponent(word)}" class="word">
            {word}
        </a>

        <b class="count">{count}</b>

        <div class="per-entry">
            {(count / entryCount).toPrecision(3)} / entry
        </div>

        {#if i < words.length - 1}
            <hr />
        {/if}
    {/each}
</div>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzJzsKCiAgICAuY29tbW9uLXdvcmRzIHsKICAgICAgICBtYXJnaW46IDAuNWVtIDA7CiAgICAgICAgZGlzcGxheTogZ3JpZDsKICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDNyZW0gMWZyIDRyZW0gOHJlbTsKICAgICAgICBncmlkLXJvdy1nYXA6IDAuM3JlbTsKICAgICAgICBtYXgtd2lkdGg6IDkwMHB4OwoKICAgICAgICBAbWVkaWEgQG1vYmlsZSB7CiAgICAgICAgICAgIG1hcmdpbjogMTBweCAwOwogICAgICAgICAgICBwYWRkaW5nOiAxMHB4IDJweDsKICAgICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAzcmVtIDFmciAxZnI7CgogICAgICAgICAgICAucGVyLWVudHJ5IHsKICAgICAgICAgICAgICAgIGRpc3BsYXk6IG5vbmU7CiAgICAgICAgICAgIH0KCiAgICAgICAgICAgIC5jb3VudCB7CiAgICAgICAgICAgICAgICB0ZXh0LWFsaWduOiByaWdodDsKICAgICAgICAgICAgICAgIG1hcmdpbi1yaWdodDogMnJlbTsKICAgICAgICAgICAgfQogICAgICAgIH0KCiAgICAgICAgLndvcmQgewogICAgICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpczsKICAgICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjsKICAgICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDsKICAgICAgICB9CgogICAgICAgIGhyIHsKICAgICAgICAgICAgZ3JpZC1jb2x1bW46IDEgLyA1OwogICAgICAgIH0KICAgIH0K"></style>