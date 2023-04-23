<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgbW9tZW50IGZyb20gJ21vbWVudCc7CiAgICBpbXBvcnQgU3ZlbHRlSGVhdG1hcCBmcm9tICdzdmVsdGUtaGVhdG1hcCc7CiAgICBpbXBvcnQgeyBCeSwgdHlwZSBFbnRyeVdpdGhXb3JkQ291bnQgfSBmcm9tICcuL2hlbHBlcnMnOwoKICAgIGV4cG9ydCBsZXQgZW50cmllczogRW50cnlXaXRoV29yZENvdW50W107CiAgICBleHBvcnQgbGV0IGJ5OiBCeTsKICAgIGxldCBkYXRhOiB7IGRhdGU6IERhdGU7IHZhbHVlOiBudW1iZXIgfVtdID0gW107CgogICAgZnVuY3Rpb24gcmVsb2FkQ2hhcnQgKCkgewogICAgICAgIGRhdGEgPSBlbnRyaWVzLm1hcChlbnRyeSA9PiB7CiAgICAgICAgICAgIHJldHVybiB7CiAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShlbnRyeS5jcmVhdGVkICogMTAwMCksCiAgICAgICAgICAgICAgICB2YWx1ZTogYnkgPT09IEJ5LkVudHJpZXMgPyAxIDogZW50cnkud29yZENvdW50LAogICAgICAgICAgICB9OwogICAgICAgIH0pOwogICAgfQoKICAgICQ6IGlmIChlbnRyaWVzICYmIHR5cGVvZiBieSA9PT0gJ251bWJlcicpIHJlbG9hZENoYXJ0KCk7CgogICAgY29uc3Qgc2hvd01vbnRocyA9IDY7CiAgICBjb25zdCBjdXJyZW50TW9udGggPSBuZXcgRGF0ZSgpLmdldE1vbnRoKCk7CiAgICBjb25zdCBsYXN0SmFuSW5DdXJyZW50WWVhciA9IGN1cnJlbnRNb250aCA8PSBzaG93TW9udGhzOwogICAgY29uc3QgbGFzdEphblllYXIgPSBsYXN0SmFuSW5DdXJyZW50WWVhcgogICAgICAgID8gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpCiAgICAgICAgOiBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkgLSAxOwo=">{}</script>

<div class="outer">
    <div class="inner">
        <SvelteHeatmap
            allowOverflow="{true}"
            cellGap="{2}"
            cellRadius="50%"
            colors="{['#95eab0', '#52d8bd', '#3397bd', '#0051cf']}"
            data="{data}"
            dayLabelWidth="{20}"
            emptyColor="{'#dfdfdf'}"
            endDate="{moment().toDate()}"
            fontColor="{'#9c9c9c'}"
            fontSize="12"
            monthGap="{20}"
            monthLabelHeight="{20}"
            monthLabels="{[
                `Jan ${lastJanYear}`,
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec'
            ]}"
            startDate="{moment().subtract(showMonths, 'months').toDate()}"
            view="{'monthly'}"
        />
    </div>
</div>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzJzsKCiAgICBAbWVkaWEgQG1vYmlsZSB7CiAgICAgICAgLm91dGVyIHsKICAgICAgICAgICAgb3ZlcmZsb3cteDogYXV0bzsKICAgICAgICAgICAgZGlyZWN0aW9uOiBydGw7CgogICAgICAgICAgICAuaW5uZXIgewogICAgICAgICAgICAgICAgd2lkdGg6IDEyMDBweDsKICAgICAgICAgICAgfQogICAgICAgIH0KICAgIH0K"></style>