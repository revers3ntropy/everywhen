import Feature from 'ol/Feature';
import { Circle } from 'ol/geom';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style } from 'ol/style';
import type { EntryLocation } from '../../../routes/stats/helpers';
import { Location } from '../../controllers/location';

export interface LocationFeature extends Feature<Circle> {
    location: Location;
}

export interface EntryFeature extends Feature<Point> {
    entry: EntryLocation;
}

export function lastEntry (entries: EntryLocation[]): EntryLocation | null {
    let lastEntry = null;
    let lastDate = null;
    for (const entry of entries) {
        if (!entry.created || !entry.latitude || !entry.longitude) continue;
        if (lastDate === null || entry.created > lastDate) {
            lastDate = entry.created;
            lastEntry = entry;
        }
    }
    return lastEntry;
}

export function olFeatureFromLocation (location: Location): LocationFeature {
    const feature = new Feature({
        geometry: new Circle(fromLonLat([
            location.longitude,
            location.latitude,
        ]), Location.degreesToMeters(location.radius)),
    }) as LocationFeature;

    feature.setStyle(
        new Style({
            renderer (coordinates, state) {
                const [ p1, p2 ] = coordinates;
                if (
                    typeof p1 === 'number'
                    || typeof p2 === 'number'
                ) {
                    return;
                }
                const [ x, y ] = p1 as number[];
                const [ x1, y1 ] = p2 as number[];

                const ctx = state.context;
                const dx = x1 - x;
                const dy = y1 - y;
                const radius = Math.sqrt(dx * dx + dy * dy);

                const innerRadius = 0;
                const outerRadius = radius * 1.4;

                const gradient = ctx.createRadialGradient(
                    x,
                    y,
                    innerRadius,
                    x,
                    y,
                    outerRadius,
                );
                gradient.addColorStop(0, 'rgba(255,0,0,0)');
                gradient.addColorStop(0.6, 'rgba(67,25,254,0.1)');
                gradient.addColorStop(1, 'rgba(113,37,186,0.3)');
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.closePath();

                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(131,93,209, 0.6)';
                ctx.fill();
                ctx.closePath();

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.strokeStyle = 'rgba(131,93,209, 0.6)';
                ctx.stroke();
                ctx.closePath();

                if (state.resolution < 1) {
                    ctx.beginPath();
                    ctx.fillStyle = 'black';
                    ctx.font = '12px sans-serif';
                    ctx.fillText(location.name, x, y - 5);
                    ctx.closePath();
                }
            },
        }),
    );

    feature.location = location;

    return feature;
}

export function olFeatureFromEntry (entry: EntryLocation): EntryFeature | null {
    if (!entry.latitude || !entry.longitude) {
        return null;
    }
    const feature = new Feature({
        geometry: new Point(fromLonLat([
            entry.longitude,
            entry.latitude,
        ])),
    }) as EntryFeature;

    feature.entry = entry;

    return feature;
}
