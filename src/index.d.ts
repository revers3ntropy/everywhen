/// <reference lib="dom" />

declare module 'crypto-browserify';

declare module 'mapbox-gl-circle' {
    class MapboxCircle {
        public constructor(
            { lat: Degrees, lng: Degrees },
            Meters,
            { editable: boolean, fillColor: string, refineStroke: boolean }
        );

        public addTo(map: Map): MapboxCircle;

        public on(evt: string, handler: (circle: MapboxCircle) => unknown);

        public getRadius(): Meters;
        public getCenter(): { lat: Degrees; lng: Degrees };
    }

    export default MapboxCircle;
}
