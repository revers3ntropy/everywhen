<script lang="ts">
    export let progress = 0;
    export let max = 1;
    export let color = "blue";
</script>
<div class="outer">
    <div class="inner" style="width: {progress/max}%"></div>
</div>
<style lang="less">
    .outer {
        width: 100%;
        height: 20px;
        background-color: #ddd;
        border-radius: 10px;
    }
    .inner {
        height: 100%;
        background-color: {color};
        border-radius: 10px;
    }
</style>