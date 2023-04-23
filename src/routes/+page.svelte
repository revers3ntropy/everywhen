<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgQ2hldnJvblJpZ2h0IGZyb20gJ3N2ZWx0ZS1tYXRlcmlhbC1pY29ucy9DaGV2cm9uUmlnaHQuc3ZlbHRlJzsKICAgIGltcG9ydCB7IGdldE5vdGlmaWNhdGlvbnNDb250ZXh0IH0gZnJvbSAnc3ZlbHRlLW5vdGlmaWNhdGlvbnMnOwogICAgaW1wb3J0IHsgZW5jcnlwdGlvbktleUZyb21QYXNzd29yZCB9IGZyb20gJy4uL2xpYi9zZWN1cml0eS9hdXRoVXRpbHMnOwogICAgaW1wb3J0IHsgYXBpIH0gZnJvbSAnLi4vbGliL3V0aWxzL2FwaVJlcXVlc3QnOwogICAgaW1wb3J0IHsgZGlzcGxheU5vdGlmT25FcnIgfSBmcm9tICcuLi9saWIvdXRpbHMvbm90aWZpY2F0aW9ucyc7CgogICAgY29uc3QgeyBhZGROb3RpZmljYXRpb24gfSA9IGdldE5vdGlmaWNhdGlvbnNDb250ZXh0KCk7CgogICAgZXhwb3J0IGxldCBkYXRhOiBBcHAuUGFnZURhdGEgJiB7CiAgICAgICAgcmVkaXJlY3Q6IHN0cmluZzsKICAgIH07CgogICAgLy8gdXNlciBsb2cgaW4gLyBjcmVhdGUgYWNjb3VudCBmb3JtIHZhbHVlcwogICAgbGV0IHBhc3N3b3JkID0gJyc7CiAgICBsZXQgdXNlcm5hbWUgPSAnJzsKCiAgICBsZXQgYWN0aW9uUGVuZGluZyA9IGZhbHNlOwoKICAgIGFzeW5jIGZ1bmN0aW9uIGxvZ2luICgpO,iBQcm9taXNlPHZvaWQ+IHsKICAgICAgICBhY3Rpb25QZW5kaW5nID0gdHJ1ZTsKICAgICAgICB,kaXNwbGF5Tm90aWZPbkVycigKICAgICAgICAgICAgYWRkTm90aWZpY2F0aW9uLAogICAgICAgICAgICBhd2FpdCBhcGkuZ2V0KGRhdGEsIGAvYXV0aGAsIHsKICAgICAgICAgICAgICAgIGtleTogZW5jcnlwdGlvbktleUZyb21QYXNzd29yZChwYXNzd29yZCksCiAgICAgICAgICAgICAgICB1c2VybmFtZQogICAgICAgICAgICB9KSwKICAgICAgICAgICAge30sCiAgICAgICAgICAgICgpID0+IChhY3Rpb25QZW5kaW5nID0gZmFsc2UpCiAgICAgICAgKTsKICAgICAgICBsb2NhdGlvbi5hc3NpZ24oJy8nICsgZGF0YS5yZWRpcmVjdCk7CiAgICB9CgogICAgYXN5bmMgZnVuY3Rpb24gY3JlYXRlICgpOiBQcm9taXNlPHZvaWQ+IHsKICAgICAgICBhY3Rpb25QZW5kaW5nID0gdHJ1ZTsKICAgICAgICBkaXNwbGF5Tm90aWZPbkVycigKICAgICAgICAgICAgYWRkTm90aWZpY2F0aW9uLAogICAgICAgICAgICBhd2FpdCBhcGkucG9zdChkYXRhLCBgL3VzZXJzYCwgewogICAgICAgICAgICAgICAgcGFzc3dvcmQ6IGVuY3J5cHRpb25LZXlGcm9tUGFzc3dvcmQocGFzc3dvcmQpLAogICAgICAgICAgICAgICAgdXNlcm5hbWUKICAgICAgICAgICAgfSksCiAgICAgICAgICAgIHt9LAogICAgICAgICAgICAoKSA9PiAoYWN0aW9uUGVuZGluZyA9IGZhbHNlKQogICAgICAgICk7CiAgICAgICAgbG9jYXRpb24uYXNzaWduKCcvJyArIGRhdGEucmVkaXJlY3QpOwogICAgfQo=">{}</script>

<main class="flex-center">
    <div class="content">
        <label>
            Username
            <input
                aria-label="Username"
                autocomplete="username"
                bind:value="{username}"
                disabled="{actionPending}"
                style="font-size: x-large"
            />
        </label>
        <label>
            Password
            <input
                aria-label="Password"
                autocomplete="current-password"
                bind:value="{password}"
                disabled="{actionPending}"
                style="font-size: x-large"
                type="password"
            />
        </label>
        <div class="flex-center" style="justify-content: space-between">
            <button
                aria-label="Create Account"
                disabled="{actionPending}"
                on:click|preventDefault="{create}"
                type="button"
            >
                Sign Up
            </button>
            <button
                aria-label="Log In"
                class="primary with-icon"
                disabled="{actionPending}"
                on:click|preventDefault="{login}"
                type="button"
            >
                <ChevronRight size="30" />
                Log In
            </button>
        </div>
    </div>
</main>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi9zdHlsZXMvbGF5b3V0JzsKCiAgICBtYWluIHsKICAgICAgICAuZmxleC1jZW50ZXIoKTsKICAgICAgICBoZWlnaHQ6IDEwMHZoOwogICAgfQoKICAgIC5jb250ZW50LAogICAgaW5wdXQgewogICAgICAgIG1heC13aWR0aDogOTR2dzsKICAgIH0KCiAgICBsYWJlbCB7CiAgICAgICAgZGlzcGxheTogZmxleDsKICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uOwogICAgICAgIG1hcmdpbjogMXJlbSAwOwogICAgfQo="></style>