<script>
    const version = __VERSION__;
</script>

<footer>
    <div>
        v{version}
    </div>
</footer>

<style lang="less">
    @import '../styles/variables';
    @import '../styles/layout.less';

    footer {
        background-color: @header-bg;
        height: 200px;
        display: grid;
        grid-template-columns: 100%;

        div {
            .flex-center();
        }
    }
</style>