import fs from 'fs';
const outputFile = 'testBackup.json';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const num = {
    entries: {
        incrementing: 100_000,
        long: {
            count: 0,
            chars: 100_000
        }
    }
};

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
            title: '',
            entry: `entry ${i}`,
            created: today - i * 60
        });
    }

    const longText = '.'.repeat(num.entries.long.chars);
    for (let i = 0; i < num.entries.long.count; i++) {
        entries.push({
            title: '',
            entry: longText,
            created: yesterday - i * 60
        });
    }

    return entries;
}

function gen() {
    console.log('Starting...');
    return {
        entries: genEntries(),
        labels: [],
        assets: [],
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
