import fs from 'fs';

const outputFile = 'testBackup.json';

/** @type {{ version: string }} */
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const MAX = {
    entries: {
        incrementing: 10_000,
        long: {
            count: 0,
            chars: 100_000
        }
    },
    labels: 100,
    assets: 1000,
    events: 1000,
    locations: 100
};

const SIMPLE = {
    entries: {
        incrementing: 5,
        long: {
            count: 5,
            chars: 10
        }
    },
    labels: 5,
    assets: 5,
    events: 5,
    locations: 5
};

const num = MAX;

function now() {
    return Math.floor(Date.now() / 1000);
}

const today = now();
const yesterday = today - 24 * 60 * 60;

function genEntries() {
    console.log('Generating entries...');
    const entries = [];

    for (let i = 0; i < num.entries.incrementing; i++) {
        entries.push({
            body: `entry ${i}`,
            created: today - i * 60 * 60 * 6
        });
    }

    const longText = '.'.repeat(num.entries.long.chars);
    for (let i = 0; i < num.entries.long.count; i++) {
        entries.push({
            body: longText,
            created: yesterday - i * 60
        });
    }

    return entries;
}

function genLabels() {
    console.log('Generating labels...');
    const labels = [];

    for (let i = 0; i < num.labels; i++) {
        labels.push({
            name: `label ${i}`,
            color: '#000000',
            created: now()
        });
    }

    return labels;
}

function genAssets() {
    console.log('Generating assets...');
    const assets = [];

    for (let i = 0; i < num.assets; i++) {
        assets.push({
            fileName: `image-${i}.png`,
            created: now(),
            content:
                'UklGRsgCAABXRUJQVlA4WAoAAAAwAAAAFwAAFwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZBTFBIrAAAAAFHIBBI4SYXEREMwLWtPZVyrrfpZkrDSpfSISUO5aSC0iH13Mj33vgbRPR/AvjXg3S78I2TpMEXezot1159/SlYwAQLGJUmnDLyJczumEkdoYO+ox8+reBWINSE5syyZyFWzJefdhk9QC5wUovxX5hwCghSyZerdxBqzOFGyaqFebeXJV8/7oKzyR9fy8cWjHwFo6wS6C1AtAD7Oi3HQfUnnCQN+NKsv90v8K9WUDggJgAAANACAJ0BKhgAGAA+bTSWR6QjIiEoCACADYlpAAA9o6AA/vucwAAA'
        });
    }

    return assets;
}

function gen() {
    console.log('Starting...');
    return {
        entries: genEntries(),
        labels: genLabels(),
        assets: genAssets(),
        events: [],
        locations: [],
        created: today,
        appVersion: packageJson.version
    };
}

function main() {
    const data = gen();
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`Done. Wrote to ${outputFile}`);
}

main();
