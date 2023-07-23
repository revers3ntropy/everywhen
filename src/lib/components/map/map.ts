import type { EntryLocation } from '$lib/controllers/entry/entry';
import Feature from 'ol/Feature';
import { Circle, Geometry } from 'ol/geom';
import Point from 'ol/geom/Point';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style } from 'ol/style';
import { Location } from '$lib/controllers/location/location.client';
import LayerVector from 'ol/layer/Vector';
import SourceVector from 'ol/source/Vector';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import { Modify } from 'ol/interaction';
import { Collection } from 'ol';
import { clientLogger } from '$lib/utils/log';
import type View from 'ol/View';

export interface LocationFeature extends Feature<Circle> {
    location: Location;
}

export interface EntryFeature extends Feature<Point> {
    entry: EntryLocation;
}

export function lastEntry(entries: EntryLocation[]): EntryLocation | null {
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

export function olLayerFromLocations(
    locations: Location[],
    view: View,
    pushToLocationChangeQueue: (
        id: string,
        latitude: Degrees,
        longitude: Degrees,
        radius: Meters
    ) => void
): {
    layer: VectorLayer<VectorSource<Geometry>>;
    interactions: Modify[];
} {
    const locationFeatures = locations.map(l => {
        return olFeatureFromLocation(l, view);
    });

    const layer = new LayerVector({
        source: new SourceVector({
            features: locationFeatures
        })
    });

    const interactions = [] as Modify[];

    for (const feature of locationFeatures) {
        const dragInteraction = new Modify({
            features: new Collection([feature]),
            style: new Style({
                renderer([x, y], state) {
                    const ctx = state.context;

                    if (typeof x !== 'number' || typeof y !== 'number') {
                        clientLogger.error('x or y is not a number', x, y);
                        return;
                    }

                    ctx.beginPath();
                    ctx.arc(x, y, 5 * devicePixelRatio, 0, 2 * Math.PI);
                    ctx.strokeStyle = 'rgba(74,74,74,0.6)';
                    ctx.stroke();
                }
            })
        });

        interactions.push(dragInteraction);

        feature.on('change', evt => {
            const target = evt.target as LocationFeature;
            const geometry = target.getGeometry() as Circle;
            const center = geometry.getCenter();
            const [lon, lat] = toLonLat(center);

            const resolution = view.getResolution();
            if (!resolution) return;

            const mPerUnit = view.getProjection().getMetersPerUnit();
            if (!mPerUnit) {
                throw new Error('mPerUnit is null');
            }

            const radius = Location.metersToDegrees(geometry.getRadius()) * devicePixelRatio;

            pushToLocationChangeQueue(feature.location.id, lat, lon, radius);

            target.location.latitude = lat;
            target.location.longitude = lon;
            target.location.radius = radius;
        });
    }

    return {
        layer,
        interactions
    };
}

export function olFeatureFromLocation(location: Location, view: View): LocationFeature {
    const mPerUnit = view.getProjection().getMetersPerUnit();
    if (!mPerUnit) {
        throw new Error('mPerUnit is null');
    }
    const resolution = view.getResolution();
    if (!resolution) {
        throw new Error('resolution is null');
    }
    const geometry = new Circle(
        fromLonLat([location.longitude, location.latitude]),
        Location.degreesToMeters(location.radius) / mPerUnit
    );

    const feature = new Feature({ geometry }) as LocationFeature;

    feature.setStyle(
        new Style({
            renderer(coordinates, state) {
                const [p1] = coordinates;
                if (typeof p1 === 'number') {
                    throw new Error('p1 is a number');
                }
                const [x, y] = p1 as number[];

                const ctx = state.context;

                const mPerUnit = view.getProjection().getMetersPerUnit();
                if (!mPerUnit) {
                    throw new Error('mPerUnit is null');
                }
                const resolution = view.getResolution();
                if (!resolution) {
                    throw new Error('resolution is null');
                }

                const radius =
                    Location.degreesToMetersPrecise(
                        location.radius,
                        resolution,
                        mPerUnit,
                        location.latitude
                    ) * devicePixelRatio;

                const innerRadius = 0;
                const outerRadius = radius * 1.4;

                const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
                gradient.addColorStop(0, 'rgba(9,221,237,0.1)');
                gradient.addColorStop(0.6, 'rgba(34,157,214,0.1)');
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

                if (radius > state.context.canvas.clientWidth / 32) {
                    ctx.beginPath();
                    ctx.fillStyle = 'black';
                    ctx.font = `${12 * devicePixelRatio}px sans-serif`;
                    ctx.fillText(location.name, x, y - 5);
                    ctx.closePath();
                }
            }
        })
    );

    feature.location = location;

    return feature;
}

export function olLayerFromEntries(entries: EntryLocation[]): VectorLayer<VectorSource<Geometry>> {
    return new LayerVector({
        source: new SourceVector({
            features: entries.map(olFeatureFromEntry).filter(Boolean)
        })
    });
}

export function olFeatureFromEntry(entry: EntryLocation): EntryFeature | null {
    if (!entry.latitude || !entry.longitude) {
        return null;
    }

    const feature = new Feature({
        geometry: new Point(fromLonLat([entry.longitude, entry.latitude]))
    }) as EntryFeature;

    feature.entry = entry;

    return feature;
}
