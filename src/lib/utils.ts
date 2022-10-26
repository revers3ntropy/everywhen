export function timeElapsedString(datetime: number): string {
    return secondsToReadable(Date.now() / 1000 - datetime)+' ago';
}

export function secondsToReadable (seconds: number, shorthand=false): string {
    let rawSeconds = seconds;
    let mins = seconds / 60;
    let hours = mins / 60;
    let days = hours / 24;
    let years = days / 365;

    let str = '';

    if (years >= 1) {
        str += Math.floor(years) + (shorthand ? 'y' : ' years');
        days %= 365;
    }

    if (days >= 1 &&  rawSeconds < 31540000) {
        str += Math.floor(days) + (shorthand ? 'd' : ' days');
        hours %= 24;
    }

    if (hours >= 1 && rawSeconds < 86400) {
        str += Math.floor(hours) + (shorthand ? 'h' : ' hours');
        mins %= 60;
    }

    if (mins >= 1 && rawSeconds < 2600) {
        str += Math.floor(mins) + (shorthand ? 'm' : ' minutes');
        seconds %= 60;
    }

    if (rawSeconds < 60) {
        str += seconds + (shorthand ? 's' : ' seconds');
    }

    return str;
}