<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnOwogICAgaW1wb3J0IHsgZ2V0Tm90aWZpY2F0aW9uc0NvbnRleHQgfSBmcm9tICdzdmVsdGUtbm90aWZpY2F0aW9ucyc7CiAgICBpbXBvcnQgdHlwZSB7IEF1dGggfSBmcm9tICcuLi9jb250cm9sbGVycy91c2VyJzsKICAgIGltcG9ydCB7IGFwaSB9IGZyb20gJy4uL3V0aWxzL2FwaVJlcXVlc3QnOwogICAgaW1wb3J0IHsKICAgICAgICBkaXNwbGF5Tm90aWZPbkVyciwKICAgICAgICBFUlJfTk9USUZJQ0FUSU9OLAogICAgICAgIFNVQ0NFU1NfTk9USUZJQ0FUSU9OLAogICAgfSBmcm9tICcuLi91dGlscy9ub3RpZmljYXRpb25zJzsKCiAgICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpOwogICAgY29uc3QgeyBhZGROb3RpZmljYXRpb24gfSA9IGdldE5vdGlmaWNhdGlvbnNDb250ZXh0KCk7CgogICAgbGV0IGxhYmVsTmFtZSA9ICcnOwogICAgbGV0IGxhYmVsQ29sb3VyID0gJyMwMDAwMDAnOwoKICAgIGV4cG9ydCBsZXQgYXV0aDogQXV0aDsKCiAgICBhc3luYyBmdW5jdGlvbiBjbG9zZUhhbmRsZXIgKCkgewogICAgICAgIGlmICghbGFiZWxOYW1lKSB7CiAgICAgICAgICAgIGFkZE5vdGlmaWNhdGlvbih7CiAgICAgICAgICAgICAgICAuLi5FUlJfTk9USUZJQ0FUSU9OLAogICAgICAgICAgICAgICAgdGV4dDogJ0ludmFsaWQgTmFtZScsCiAgICAgICAgICAgIH0pOwogICAgICAgICAgICByZXR1cm47CiAgICAgICAgfQoKICAgICAgICBkaXNwbGF5Tm90aWZPbkVycigKICAgICAgICAgICAgYWRkTm90aWZpY2F0aW9uLAogICAgICAgICAgICBhd2FpdCBhcGkucG9zdChhdXRoLCAnL2xhYmVscycsIHsKICAgICAgICAgICAgICAgIG5hbWU6IGxhYmVsTmFtZSwKICAgICAgICAgICAgICAgIGNvbG91cjogbGFiZWxDb2xvdXIsCiAgICAgICAgICAgIH0pLAogICAgICAgICk7CgogICAgICAgIGFkZE5vdGlmaWNhdGlvbih7CiAgICAgICAgICAgIC4uLlNVQ0NFU1NfTk9USUZJQ0FUSU9OLAogICAgICAgICAgICB0ZXh0OiAnTGFiZWwgY3JlYXRlZCcsCiAgICAgICAgfSk7CgogICAgICAgIGxhYmVsTmFtZSA9ICcnOwoKICAgICAgICBkaXNwYXRjaCgnc3VibWl0Jyk7CiAgICB9Cg==">{}</script>

<div>
    <div>
        <h1>Create New Label</h1>
    </div>
    <div class="content">
        <label>
            Name<br />
            <input bind:value="{labelName}" type="text" />
        </label>
        <label>
            Colour<br />
            <input bind:value="{labelColour}" type="color" />
            <input bind:value="{labelColour}" type="text" />
        </label>
    </div>
    <div class="actions">
        <button class="primary" on:click="{closeHandler}"> Create</button>
    </div>
</div>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi8uLi9zdHlsZXMvdmFyaWFibGVzJzsKICAgIEBpbXBvcnQgJy4uLy4uL3N0eWxlcy90ZXh0JzsKCiAgICAuY29udGVudCB7CiAgICAgICAgbWFyZ2luLWxlZnQ6IDEwdnc7CgogICAgICAgIGxhYmVsIHsKICAgICAgICAgICAgLnRleHQtbGlnaHQoKTsKCiAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrOwogICAgICAgICAgICBtYXJnaW46IDFyZW07CgogICAgICAgICAgICBpbnB1dCB7CiAgICAgICAgICAgICAgICBtYXJnaW46IDAuMnJlbSAwIDAgMDsKICAgICAgICAgICAgfQogICAgICAgIH0KICAgIH0KCiAgICAuYWN0aW9ucyB7CiAgICAgICAgZGlzcGxheTogZmxleDsKICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsKCiAgICAgICAgYnV0dG9uIHsKICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgQGJvcmRlcjsKICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogQGJvcmRlci1yYWRpdXM7CiAgICAgICAgICAgIHBhZGRpbmc6IDFlbTsKICAgICAgICAgICAgbWFyZ2luOiAxZW07CgogICAgICAgICAgICAmOmhvdmVyIHsKICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6IEBsaWdodC1hY2NlbnQ7CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9Cg=="></style>