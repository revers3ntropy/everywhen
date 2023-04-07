<script lang="ts">
    import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
    import ImageArea from 'svelte-material-icons/ImageArea.svelte';
    import NoteEditOutline from 'svelte-material-icons/NoteEditOutline.svelte';
    import OpenInNew from 'svelte-material-icons/OpenInNew.svelte';
    import { API_DOCS_LINK } from '../../lib/constants';
</script>

<main class="flex-center">
    <section>
        <h1>Halcyon.Land</h1>

        <p>
            Halcyon.Land is an
            <a
                aria-label="Source code"
                href="http://github.com/revers3ntropy/halcyon.land"
                rel="noreferrer"
                target="_blank"
            >
                open source
                <OpenInNew size="12" />
            </a>
            journal / life logging app.
            It's a place to record your thoughts, feelings, and experiences.
            It's a place to keep track of your life, and
            <i>invoke a feeling of halcyon</i>.
        </p>
        <p>
            Please note that this is a work in progress,
            and bug reports and feature requests are welcome on the
            <a
                aria-label="Report issues and feature requests"
                href="http://github.com/revers3ntropy/halcyon.land/issues"
                rel="noreferrer"
                target="_blank"
            >
                GitHub issues
                <OpenInNew size="12" />
            </a>.
        </p>

        <h2>Your Data</h2>
        <p>
            The core of Halcyon.Land is making you feel safe to write anything.
            Everything, even your settings, are encrypted before being stored,
            using your password. As your password is not stored on the server,
            even if the entire server was leaked, no-one could read your
            entries.
        </p>
        <p>
            However this security comes with a compromise.
            If you lose your password, there is no way to recover your data.
            I would recommend using a password manager to generate a strong
            password, and storing it somewhere safe.
            You can then set a passcode as an additional layer of security
            which is easier to remember.
        </p>
        <p>
            Please disclose any security vulnerabilities to me at
            <a href="mailto:joseph.coppin+halcyon@gmail.com">
                joseph.coppin+halcyon@gmail.com
            </a>
            , rather than publicly on the GitHub issues.
        </p>

        <h2>Entries</h2>

        <p>
            Record your entries in the <a href="/journal">journal</a>.
            Each entry stores a title, a body, a label, a timestamp and
            optionally your location when writing it.
        </p>
        <p>
            You can edit entries by clicking
            <NoteEditOutline />
            , but all your previous versions are stored,
            so you can always see what you changed and when.
            You can mark an entry as deleted, and it will be hidden from your
            journal.
            However, once you submit an entry, there is no way to delete it
            permanently.
        </p>
        <p>
            Your recent entries will appear on the home page,
            as well as entries from the same day in previous years.
        </p>
        <p>
            You can write in MarkDown/HTML in your entries. For example
            <code>**bold**</code> or
            <code>&lt;b>bold&lt;/b></code>.
            The HTML is sanitized before being shown.
            You can insert images into entries by dragging and dropping them
            into the entry, or clicking
            <ImageArea />
            .
        </p>

        <h2>Events</h2>

        <p>
            Events are completely separate to your entries and can be modified
            and deleted at any time.
            Events are a way to keep track of things that happen in your life,
            such as birthdays, holidays, TV shows you've watched and more.
            Events can either be 'instant' event, or 'duration' events.
            Instant events are events that happen at a specific time, such as a
            birthday.
            Duration events are events that happen over a period of time, such
            as a holiday. You can also add labels to events.
        </p>

        <h2>Timeline</h2>

        <p>
            Both your entries and events are displayed on the timeline.
            Instant events appear as 'pins', while duration events appear as
            'bars'.
            The colour of the event represents its label.
        </p>
        <p>
            Entries appear in the timeline as grey bars hanging down from the
            center horizontal line.
            The height of the bar represents the number of words in the entry.
        </p>
        <p>
            The blue line is the current time, which updates in real time.
            Zoom in and out by scrolling, or dragging up and down for mobile.
            Drag left and right to scroll through time.
        </p>
        <p>
            The short green bar always appears in the middle of our screen and
            is like a
            cursor which shows the date and time at that point on the timeline.
        </p>
        <p>
            You can set the starting year of the timeline in
            <a href="/settings">settings</a>.
        </p>

        <h2>Backups</h2>

        <p>
            You can download backups from the
            <a href="/settings">settings</a>
            page, or by pressing <code>ctrl + s</code>
            (or <code>cmd + s</code> on Mac).
            By default the backup is encrypted, meaning you can only recover it
            with the password of the account it was created with.
            You can also download an unencrypted backup from settings,
            which can be recovered by anyone, but can also be recovered from
            if you lose your password.
        </p>
        <p>
            Recover from a backup file from the
            <a href="/settings">settings</a>
            page.
        </p>

        <h2>Blurring</h2>

        <p>
            You can toggle the blurring of various parts of the page which
            may contain sensitive information.
            For example, you can have everything blur after an amount of time
            of inactivity.
            It allows you to view pages containing sensitive information
            without having to worry about other people seeing it.
        </p>
        <p>
            Press <code>ctrl + esc</code> (or <code>cmd + esc</code> on Mac) to
            toggle the blurring across the page.
            You can change the configuration of this blurring in
            <a href="/settings">settings</a>.
        </p>

        <h2>Gallery</h2>

        <p>
            You can view all the images you have uploaded in the
            <a href="/assets">gallery</a>.
            Images are not automatically deleted when you delete an entry.
            When you delete an image, the image the not removed from the entry,
            which will leave a broken link.
            The entire image is encrypted when stored, and included in backups.
        </p>
        <p>
            The
            <ContentCopy />
            button will copy the markdown to link to the image to your
            clipboard.
        </p>

        <h2>API</h2>

        <p>
            The docs to the public API can be found on
            <a
                aria-label="Link to API docs"
                href="{API_DOCS_LINK}"
                rel="noreferrer"
                target="_blank"
            >this</a>
            Google Sheets.
        </p>
    </section>
</main>


<style lang="less">
    @import '../../styles/variables';

    @media @mobile {
        main {
            padding: 1rem;
        }
    }

    p {
        max-width: 500px;
    }
</style>