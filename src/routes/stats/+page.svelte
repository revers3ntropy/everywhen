<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJzsKICAgIGltcG9ydCBDb3VudGVyIGZyb20gJ3N2ZWx0ZS1tYXRlcmlhbC1pY29ucy9Db3VudGVyLnN2ZWx0ZSc7CiAgICBpbXBvcnQgQ29tbW9uV29yZHNMaXN0IGZyb20gJy4vQ29tbW9Xb3Jkc0xpc3Quc3ZlbHRlJzsKICAgIGltcG9ydCBFbnRyeUJhckNoYXJ0IGZyb20gJy4vRW50cnlCYXJDaGFydC5zdmVsdGUnOwogICAgaW1wb3J0IEVudHJ5SGVhdE1hcCBmcm9tICcuL0VudHJ5SGVhdE1hcC5zdmVsdGUnOwogICAgaW1wb3J0IHsgQnksIHR5cGUgRW50cnlXaXRoV29yZENvdW50IH0gZnJvbSAnLi9oZWxwZXJzJzsKICAgIGltcG9ydCBTZWFyY2hGb3JXb3JkIGZyb20gJy4vU2VhcmNoRm9yV29yZC5zdmVsdGUnOwogICAgaW1wb3J0IFN0YXRQaWxsIGZyb20gJy4vU3RhdFBpbGwuc3ZlbHRlJzsKCiAgICBsZXQgYnk6IEJ5ID0gQnkuRW50cmllczsKCiAgICBleHBvcnQgbGV0IGRhdGE6IEFwcC5QYWdlRGF0YSAmIHsKICAgICAgICBlbnRyaWVzOiBFbnRyeVdpdGhXb3JkQ291bnRbXTsKICAgICAgICBlbnRyeUNvdW50OiBudW1iZXI7CiAgICAgICAgd29yZENvdW50OiBudW1iZXI7CiAgICAgICAgY2hhckNvdW50OiBudW1iZXI7CiAgICAgICAgY29tbW9uV29yZHM6IFsgc3RyaW5nLCBudW1iZXIgXVtdOwogICAgICAgIGRheXM6IG51bWJlcjsKICAgIH07CgogICAgb25Nb3VudCgoKSA9PiAoZG9jdW1lbnQudGl0bGUgPSAnQW5hbHl0aWNzJykpOwo=">{}</script>

<svelte:head>
    <title>Analytics</title>
    <meta content="Analytics" name="description" />
</svelte:head>

<main>
    {#if data.entries.length === 0}
        <section class="container unbordered">
            <h1>No Entries</h1>
            <div class="flex-center">
                <p>
                    You need to create some entries before you can see
                    analytics,
                    <a href="/journal">why not create one?</a>
                </p>
            </div>
        </section>
    {:else}
        <div class="title-line">
            <div></div>
            <div>
                <h1>
                    <Counter size="40" />
                    <span>Analytics</span>
                </h1>
            </div>
            <div class="search-for-word">
                <SearchForWord />
            </div>
        </div>

        <section class="container unbordered">
            <div class="stats">
                <StatPill primary value="{data.entryCount}" label="entries" />
                <StatPill value="{data.charCount}" label="characters" />
                <StatPill
                    primary
                    value="{data.wordCount}"
                    label="words"
                    tooltip="A typical novel is 100,000 words"
                />
                <StatPill
                    value="{(data.wordCount / (data.entryCount || 1)).toFixed(
                        1
                    )}"
                    label="words / entry"
                />
                <StatPill
                    value="{(data.charCount / (data.wordCount || 1)).toFixed(
                        1
                    )}"
                    label="letters / word"
                    tooltip="The average English word is 4.7 letters long"
                />
                <StatPill
                    primary
                    value="{(data.wordCount / data.days).toFixed(1)}"
                    label="words / day"
                />
                <StatPill
                    value="{(
                        data.entryCount / Math.max(data.days / 7, 1)
                    ).toFixed(1)}"
                    label="entries / week"
                />
            </div>
        </section>

        <section class="charts">
            <div class="entry-heatmap-wrapper container">
                <EntryHeatMap by="{by}" entries="{data.entries}" />
            </div>
            {#if data.entryCount > 4}
                <div class="entry-bar-chart-wrapper container">
                    <EntryBarChart by="{by}" entries="{data.entries}" />
                </div>
            {/if}
        </section>

        <section class="container">
            <CommonWordsList
                entryCount="{data.entryCount}"
                words="{data.commonWords}"
            />
        </section>
    {/if}
</main>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvbGF5b3V0JzsKICAgIEBpbXBvcnQgJy4uLy4uL3N0eWxlcy92YXJpYWJsZXMnOwoKICAgIC50aXRsZS1saW5lIHsKICAgICAgICBkaXNwbGF5OiBncmlkOwogICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyIDFmciAxZnI7CiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjsKCiAgICAgICAgLnNlYXJjaC1mb3Itd29yZCB7CiAgICAgICAgICAgIHRleHQtYWxpZ246IHJpZ2h0OwogICAgICAgIH0KCiAgICAgICAgQG1lZGlhIEBtb2JpbGUgewogICAgICAgICAgICBkaXNwbGF5OiBibG9jazsKCiAgICAgICAgICAgICYgPiAqIHsKICAgICAgICAgICAgICAgIG1hcmdpbjogMC41cmVtIDA7CiAgICAgICAgICAgIH0KCiAgICAgICAgICAgIC5zZWFyY2gtZm9yLXdvcmQgewogICAgICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyOwogICAgICAgICAgICB9CiAgICAgICAgfQogICAgfQoKICAgIGgxIHsKICAgICAgICAuZmxleC1jZW50ZXIoKTsKICAgICAgICBmb250LXNpemU6IDQwcHg7CiAgICAgICAgbWFyZ2luOiAwOwogICAgICAgIHBhZGRpbmc6IDA7CgogICAgICAgIHNwYW4gewogICAgICAgICAgICBtYXJnaW4tbGVmdDogMC41cmVtOwogICAgICAgIH0KICAgIH0KCiAgICAuc3RhdHMgewogICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjsKICAgICAgICBkaXNwbGF5OiBmbGV4OwogICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyOwogICAgICAgIGZsZXgtd3JhcDogd3JhcDsKICAgIH0KCiAgICAuY2hhcnRzIHsKICAgICAgICAmID4gKiB7CiAgICAgICAgICAgIG1hcmdpbjogMC41ZW0gMDsKICAgICAgICB9CgogICAgICAgIC5lbnRyeS1iYXItY2hhcnQtd3JhcHBlciB7CiAgICAgICAgICAgIHBhZGRpbmctYm90dG9tOiAwOwogICAgICAgIH0KICAgIH0KCiAgICAuY29udGFpbmVyIHsKICAgICAgICBwYWRkaW5nOiAxZW07CiAgICAgICAgbWFyZ2luOiAxZW07CgogICAgICAgIEBtZWRpYSBAbW9iaWxlIHsKICAgICAgICAgICAgcGFkZGluZzogMCAwLjZyZW07CiAgICAgICAgICAgIG1hcmdpbjogMWVtIDA7CiAgICAgICAgICAgIGJvcmRlcjogbm9uZTsKICAgICAgICB9CiAgICB9Cg=="></style>