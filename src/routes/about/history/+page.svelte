<script lang="ts">
    const version = __VERSION__;
</script>

<svelte:head>
    <title>Version History | Halcyon.Land</title>
</svelte:head>

<main class="flex-center">
    <div>
        <h1> Version History </h1>
        <i>
            Currently {version}, working towards version 1.0
        </i>
        <section>
            <h2>Upcoming Features</h2>
            <ul>
                <li>Datasets</li>
                <li>Achievements/Badges</li>
                <li>Mood attached to entries</li>
                <li>Automatic mood tracking with Tone Analysis</li>
                <li>Backup to Google Drive</li>
                <li>Sync with Google Fit</li>
                <li>Sync with GitHub</li>
                <li>2-Factor authentication</li>
                <li>Opt in to allowing account to be recovered at expense of security</li>
                <li>Tags with '#' in entry</li>
                <li>Opt in to sharing stats with other users - Leaderboards</li>
                <li>'Hidden Tab' mode</li>
            </ul>
        </section>
        <section>
            <h2>0.5</h2>
            <ul>
                <li>Allow app to be installed on mobile (PWA)</li>
                <li>Better zooming the timeline on mobile</li>
                <li>Easily link to already uploaded images</li>
                <li>Filter by Label in timeline</li>
                <li>Themes (light/dark mode)</li>
                <li>Forgot Passcode</li>
                <li>Formatting options in entry form</li>
                <li>Make the timeline interactive</li>
                <li>Change password</li>
                <li>Collapse a day of entries</li>
                <li>Record and use User Agent info on entries</li>
                <li>Streak widget</li>
                <li>View entries near a location</li>
                <li>Entries look for locations near them</li>
                <li>Create, Modify and Delete Named Locations</li>
                <li>'/about' and '/about/history' pages</li>
                <li>Caching</li>
                <li>'+' button in navbar</li>
                <li>More general stats on insights page</li>
                <li>Don't blur by default</li>
                <li>Keyboard shortcuts for Macs</li>
                <li>Clear entry form when logging out</li>
                <li>YoB setting for timeline</li>
                <li>Better timeline styling</li>
                <li>Timezones</li>
                <li>Gallery page</li>
                <li>Blur events</li>
                <li>Blur entry form</li>
            </ul>
        </section>
        <section>
            <h2>0.4</h2>
            <ul>
                <li>Made public on GitHub</li>
                <li>Download plaintext backups</li>
                <li>Better mobile support</li>
                <li>Better default zoom for timeline</li>
                <li>'n' Years Ago Today entries</li>
                <li>Better 'buckets' for barchart in insights</li>
                <li>Ask to leave page with unsaved changes when editing entry</li>
            </ul>
        </section>
        <section>
            <h2>0.3</h2>
            <ul>
                <li>Made public on GitHub</li>
                <li>Download plaintext backups</li>
                <li>Better mobile support</li>
                <li>Better default zoom for timeline</li>
                <li>'n' Years Ago Today entries</li>
                <li>Better 'buckets' for barchart in insights</li>
                <li>Ask to leave page with unsaved changes when editing entry</li>
            </ul>
        </section>
        <section>
            <h2>0.2</h2>
            <ul>
                <li>Better navbar for mobile</li>
                <li>Import entries from JSON file</li>
                <li>Import events from JSON file</li>
                <li>Passcode</li>
                <li>Edit entries</li>
                <li>Markdown/HTML in entries</li>
                <li>User settings</li>
            </ul>
        </section>
        <section>
            <h2>0.1</h2>
            <ul>
                <li>Publish to halcyon.land</li>
                <li>Integrate testing framework</li>
                <li>Show events in timeline</li>
                <li>Location toggle</li>
                <li>Instant/Duration events</li>
                <li>Create events</li>
                <li>Upload images</li>
                <li>Stats (Insights) page</li>
                <li>Search entries</li>
                <li>Filter entries by label</li>
                <li>Blur entries</li>
                <li>Timeline</li>
                <li>Labels</li>
                <li>Download and restore backups</li>
                <li>Mobile Support</li>
                <li>Edit labels</li>
                <li>Bin</li>
                <li>Delete entries</li>
                <li>Submit and view entries</li>
            </ul>
        </section>
    </div>
</main>

<style lang="less">
    h1 {
        margin: 1rem;
    }

    h2 {
        padding: 1rem;
    }

    li {
        margin-bottom: 4px;
    }
</style>
