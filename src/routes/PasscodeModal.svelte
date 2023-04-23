<script lang="ts" ✂prettier:content✂="CiAgICBpbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnJGFwcC9lbnZpcm9ubWVudCc7CiAgICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSAnc3ZlbHRlJzsKICAgIGltcG9ydCB7IHBhc3Njb2RlTGFzdEVudGVyZWQgfSBmcm9tICcuLi9saWIvc3RvcmVzJzsKICAgIGltcG9ydCB7IG5vd1MgfSBmcm9tICcuLi9saWIvdXRpbHMvdGltZSc7CiAgICBpbXBvcnQgeyB3aGVlbCB9IGZyb20gJy4uL2xpYi91dGlscy90b2dnbGVTY3JvbGxhYmxlJzsKCiAgICBleHBvcnQgbGV0IHNob3cgPSB0cnVlOwogICAgZXhwb3J0IGxldCBwYXNzY29kZTogc3RyaW5nOwoKICAgIGxldCBpbnB1dDogc3RyaW5nOwoKICAgIGxldCBsb2FkZWQgPSBmYWxzZTsKICAgIG9uTW91bnQoKCkgPT4gewogICAgICAgIGxvYWRlZCA9IHRydWU7CiAgICB9KTsKCiAgICBsZXQgbGFzdFlTY3JvbGwgPSAwOwoKICAgICQ6IGlmIChpbnB1dCA9PT0gcGFzc2NvZGUgJiYgYnJvd3NlcikgewogICAgICAgIGlucHV0ID0gJyc7CiAgICAgICAgcGFzc2NvZGVMYXN0RW50ZXJlZC5zZXQobm93UygpKTsKICAgICAgICBzaG93ID0gZmFsc2U7CiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7CiAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCBsYXN0WVNjcm9sbCk7CiAgICAgICAgICAgIGxhc3RZU2Nyb2xsID0gMDsKICAgICAgICB9LCAwKTsKICAgIH0KCiAgICAkOiBpZiAoc2hvdyAmJiAhbGFzdFlTY3JvbGwgJiYgYnJvd3NlcikgewogICAgICAgIGxhc3RZU2Nyb2xsID0gd2luZG93LnNjcm9sbFk7CiAgICB9Cg==">{}</script>

<svelte:window use:wheel="{{ scrollable: !show }}" />

<div class="modal-container {show ? 'show' : ''}">
    {#if loaded}
        <div class="content">
            <h1>Please enter your passcode</h1>
            <!-- svelte-ignore a11y-autofocus -->
            <input
                type="text"
                bind:value="{input}"
                placeholder="Passcode"
                autocomplete="off"
                autofocus
                data-lpignore="true"
                class="password-input"
            />
        </div>
    {/if}
</div>

<style lang="less" ✂prettier:content✂="CiAgICBAaW1wb3J0ICcuLi9zdHlsZXMvbGF5b3V0JzsKCiAgICAubW9kYWwtY29udGFpbmVyIHsKICAgICAgICAuZmxleC1jZW50ZXIoKTsKCiAgICAgICAgcG9zaXRpb246IGZpeGVkOwogICAgICAgIHRvcDogMDsKICAgICAgICBsZWZ0OiAwOwogICAgICAgIHdpZHRoOiAxMDB2dzsKICAgICAgICBoZWlnaHQ6IDEwMHZoOwogICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMCwgMCwgMCwgMC4yKTsKICAgICAgICB6LWluZGV4OiAxNTAwOwogICAgICAgIG1hcmdpbjogMDsKICAgICAgICBwYWRkaW5nOiAwOwogICAgICAgIGJvcmRlci1yYWRpdXM6IDA7CiAgICAgICAgYm9yZGVyOiBub25lOwogICAgICAgIGJhY2tkcm9wLWZpbHRlcjogYmx1cigxNXB4KTsKICAgICAgICBvdmVyZmxvdzogYXV0bzsKICAgICAgICBkaXNwbGF5OiBub25lOwoKICAgICAgICAmLnNob3cgewogICAgICAgICAgICBkaXNwbGF5OiBmbGV4OwogICAgICAgIH0KCiAgICAgICAgLmNvbnRlbnQgewogICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7CiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC4yKTsKICAgICAgICAgICAgYmFja2Ryb3AtZmlsdGVyOiBibHVyKDMwcHgpOwogICAgICAgICAgICBwYWRkaW5nOiAxcmVtIDJyZW0gMnJlbSAycmVtOwogICAgICAgICAgICBib3JkZXItcmFkaXVzOiBAYm9yZGVyLXJhZGl1czsKCiAgICAgICAgICAgIC5wYXNzd29yZC1pbnB1dCB7CiAgICAgICAgICAgICAgICAtd2Via2l0LXRleHQtc2VjdXJpdHk6IGRpc2M7CiAgICAgICAgICAgICAgICAtbW96LXRleHQtc2VjdXJpdHk6IGRpc2M7CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICB9Cg=="></style>