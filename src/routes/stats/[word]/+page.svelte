<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJzsKICAgIGltcG9ydCBBcnJvd0xlZnQgZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL0Fycm93TGVmdC5zdmVsdGUnOwogICAgaW1wb3J0IENvdW50ZXIgZnJvbSAnc3ZlbHRlLW1hdGVyaWFsLWljb25zL0NvdW50ZXIuc3ZlbHRlJzsKICAgIGltcG9ydCBFbnRyaWVzIGZyb20gJy4uLy4uLy4uL2xpYi9jb21wb25lbnRzL0VudHJpZXMuc3ZlbHRlJzsKICAgIGltcG9ydCB7IEJ5LCB0eXBlIEVudHJ5V2l0aFdvcmRDb3VudCB9IGZyb20gJy4uL2hlbHBlcnMnOwogICAgaW1wb3J0IFNlYXJjaEZvcldvcmQgZnJvbSAnLi4vU2VhcmNoRm9yV29yZC5zdmVsdGUnOwogICAgaW1wb3J0IFN0YXRQaWxsIGZyb20gJy4uL1N0YXRQaWxsLnN2ZWx0ZSc7CiAgICBpbXBvcnQgRW50cnlCYXJDaGFydCBmcm9tICcuLy4uL0VudHJ5QmFyQ2hhcnQuc3ZlbHRlJzsKICAgIGltcG9ydCBFbnRyeUhlYXRNYXAgZnJvbSAnLi8uLi9FbnRyeUhlYXRNYXAuc3ZlbHRlJzsKCiAgICBsZXQgYnk6IEJ5ID0gQnkuV29yZHM7CgogICAgZXhwb3J0IGxldCBkYXRhOiBBcHAuUGFnZURhdGEgJiB7CiAgICAgICAgZW50cmllczogRW50cnlXaXRoV29yZENvdW50W107CiAgICAgICAgd29yZENvdW50OiBudW1iZXI7CiAgICAgICAgd29yZEluc3RhbmNlczogbnVtYmVyOwogICAgICAgIHRoZVdvcmQ6IHN0cmluZzsKICAgICAgICB0b3RhbEVudHJpZXM6IG51bWJlcjsKICAgIH07CgogICAgb25Nb3VudCgoKSA9PiAoZG9jdW1lbnQudGl0bGUgPSAnQW5hbHl0aWNzJykpOwo=">{}</script>

<svelte:head>
    <title>Analytics</title>
    <meta content="Analytics" name="description" />
</svelte:head>

<main>
    <div class="title-line">
        <div>
            <a class="icon-button" href="/stats">
                <ArrowLeft size="40" />
            </a>
        </div>
        <div>
            <h1>
                <span class="stats-icon">
                    <Counter size="40" />
                </span>
                <span class="the-word-with-quotes">
                    '<span class="the-word">{data.theWord}</span>'
                </span>
            </h1>
        </div>
        <div class="search-for-word">
            <SearchForWord value="{data.theWord}" />
        </div>
    </div>
    {#if data.wordInstances === 0}
        <section class="container unbordered">
            <div class="flex-center">
                <p>
                    You've never used that word before!
                    <a href="/journal">Why not try it out?</a>
                </p>
            </div>
        </section>
    {:else}
        <section class="container unbordered">
            <div class="stats">
                <StatPill
                    primary
                    beforeLabel="appears"
                    value="{data.wordInstances}"
                    label="times"
                />
                <StatPill
                    beforeLabel="in"
                    value="{data.entries.length}"
                    label="entries"
                />
                <StatPill
                    value="{(data.wordInstances / data.totalEntries).toFixed(
                        1
                    )}"
                    label="/ entry"
                />
                <StatPill
                    beforeLabel="appears in"
                    value="{(
                        (data.entries.length / data.totalEntries) *
                        100
                    ).toFixed(1)}"
                    label="% of entries"
                />
            </div>
        </section>

        <section class="charts">
            <div class="entry-heatmap-wrapper container">
                <EntryHeatMap by="{by}" entries="{data.entries}" />
            </div>
            <div class="entry-bar-chart-wrapper container">
                <EntryBarChart by="{by}" entries="{data.entries}" />
            </div>
        </section>

        <section class="entries">
            <Entries
                auth="{data}"
                options="{{ search: data.theWord }}"
                pageSize="{data.settings.entriesPerPage.value}"
                showSearch="{false}"
            />
        </section>
    {/if}
</main>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi8uLi9zdHlsZXMvbGF5b3V0JzsKICAgIEBpbXBvcnQgJy4uLy4uLy4uL3N0eWxlcy92YXJpYWJsZXMnOwoKICAgIC50aXRsZS1saW5lIHsKICAgICAgICBkaXNwbGF5OiBncmlkOwogICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyIDFmciAxZnI7CiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjsKCiAgICAgICAgLnNlYXJjaC1mb3Itd29yZCB7CiAgICAgICAgICAgIHRleHQtYWxpZ246IHJpZ2h0OwogICAgICAgIH0KCiAgICAgICAgQG1lZGlhIEBtb2JpbGUgewogICAgICAgICAgICBtYXJnaW46IDFyZW07CiAgICAgICAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMTBweCAxZnI7CgogICAgICAgICAgICAuc2VhcmNoLWZvci13b3JkIHsKICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMS41cmVtOwogICAgICAgICAgICAgICAgbWFyZ2luOiAwLjRyZW0gMDsKICAgICAgICAgICAgfQoKICAgICAgICAgICAgLnN0YXRzLWljb24sCiAgICAgICAgICAgIC50aGUtd29yZC13aXRoLXF1b3RlcyB7CiAgICAgICAgICAgICAgICBkaXNwbGF5OiBub25lOwogICAgICAgICAgICB9CiAgICAgICAgfQogICAgfQoKICAgIGgxIHsKICAgICAgICAuZmxleC1jZW50ZXIoKTsKICAgICAgICBmb250LXNpemU6IDQwcHg7CiAgICAgICAgbWFyZ2luOiAwOwogICAgICAgIHBhZGRpbmc6IDA7CgogICAgICAgIHNwYW4gewogICAgICAgICAgICBtYXJnaW4tbGVmdDogMC41cmVtOwogICAgICAgIH0KICAgIH0KCiAgICAuc3RhdHMgewogICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjsKICAgICAgICBkaXNwbGF5OiBmbGV4OwogICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyOwogICAgICAgIGZsZXgtd3JhcDogd3JhcDsKICAgIH0KCiAgICAuY2hhcnRzIHsKICAgICAgICAmID4gKiB7CiAgICAgICAgICAgIG1hcmdpbjogMC41ZW0gMDsKICAgICAgICB9CgogICAgICAgIC5lbnRyeS1iYXItY2hhcnQtd3JhcHBlciB7CiAgICAgICAgICAgIHBhZGRpbmctYm90dG9tOiAwOwogICAgICAgIH0KICAgIH0KCiAgICAuY29udGFpbmVyIHsKICAgICAgICBwYWRkaW5nOiAxZW07CiAgICAgICAgbWFyZ2luOiAxZW07CgogICAgICAgIEBtZWRpYSBAbW9iaWxlIHsKICAgICAgICAgICAgcGFkZGluZzogMCAwLjZyZW07CiAgICAgICAgICAgIG1hcmdpbjogMWVtIDA7CiAgICAgICAgICAgIGJvcmRlcjogbm9uZTsKICAgICAgICB9CiAgICB9CgogICAgLnRoZS13b3JkLXdpdGgtcXVvdGVzIHsKICAgICAgICBtYXgtd2lkdGg6IGNhbGMoMTAwdncgLSA0MDBweCk7CiAgICAgICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7CiAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjsKICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwOwogICAgfQoKICAgIC5lbnRyaWVzIHsKICAgICAgICBwYWRkaW5nOiAxcmVtOwoKICAgICAgICBAbWVkaWEgQG1vYmlsZSB7CiAgICAgICAgICAgIHBhZGRpbmc6IDA7CiAgICAgICAgfQogICAgfQo="></style>