<script lang="ts">
    import mapboxgl, { type LngLatBoundsLike, type LngLatLike } from 'mapbox-gl';
    import type { Map } from 'mapbox-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';
    import { theme } from '$lib/stores';
    import { Theme } from '$lib/constants';
    import { Location } from '$lib/controllers/location/location';
    import { notify } from '$lib/components/notifications/notifications';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import type { Meters, Degrees } from '../../../types';
    import type { Entry } from '$lib/controllers/entry/entry';
    // this module can't be SSR'ed so can only import as type
    import type MapboxCircle from 'mapbox-gl-circle';

    // default to the UK :)
    export let defaultCenter: LngLatLike = { lat: -4, lng: 53 };
    export let defaultZoom = 4;
    export let bounds: LngLatBoundsLike | undefined;

    export let locations: Location[] = [];
    export let entries: Entry[] = [];

    export let locationsAreEditable = false;

    let className: string | undefined = undefined;
    export { className as class };

    // https://docs.mapbox.com/help/glossary/access-token/
    mapboxgl.accessToken =
        'pk.eyJ1IjoicmV2ZXJzM250cm9weSIsImEiOiJja3NxNmhjZ3EwOXZpMnFvM2Znd3puZmZyIn0.og-Btcduk-VzD4XAEsuZcQ';

    let map: Map;

    function themeToMapStyle(theme: Theme): string {
        switch (theme) {
            case Theme.dark:
                return 'mapbox://styles/mapbox/dark-v10';
            default:
                return 'mapbox://styles/mapbox/streets-v10';
        }
    }

    async function updateLocationCenter(
        locationId: string,
        newCenter: { lat: Degrees; lng: Degrees }
    ) {
        notify.onErr(
            await api.put(apiPath('/locations/?', locationId), {
                latitude: newCenter.lat,
                longitude: newCenter.lng
            })
        );
        notify.success('Updated location position');
    }

    async function updateLocationRadius(locationId: string, newRadius: Meters) {
        notify.onErr(
            await api.put(apiPath('/locations/?', locationId), {
                radius: newRadius
            })
        );
        notify.success('Updated location radius');
    }

    theme.subscribe(newTheme => {
        // update map when theme changes
        if (map) map.setStyle(themeToMapStyle(newTheme));
    });

    function addLocationsToMap(
        _MapboxCircle: typeof MapboxCircle,
        map: Map,
        locations: Location[]
    ) {
        for (const location of locations) {
            const locationCircle = new _MapboxCircle(
                { lat: location.latitude, lng: location.longitude },
                Location.degreesToMeters(location.radius),
                {
                    editable: locationsAreEditable,
                    fillColor: 'rgba(255, 0, 200, 0.1)',
                    refineStroke: true
                }
            ).addTo(map);
            if (!locationsAreEditable) continue;

            locationCircle.on('centerchanged', circle => {
                updateLocationCenter(location.id, circle.getCenter());
            });
            locationCircle.on('radiuschanged', circle => {
                updateLocationRadius(location.id, Location.metersToDegrees(circle.getRadius()));
            });
        }
    }

    function addEntriesToMap(_MapboxCircle: typeof MapboxCircle, map: Map, entries: Entry[]) {
        // should already always have locations but just double check
        const entriesWithLocations = entries.filter(
            e => typeof e.latitude === 'number' && typeof e.longitude === 'number'
        );
        map.addSource('entries', {
            type: 'geojson',
            generateId: true,
            // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
            // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
            data: {
                type: 'FeatureCollection',
                features: entriesWithLocations.map(e => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [e.latitude!, e.longitude!]
                    },
                    properties: {
                        title: e.title
                    }
                }))
            },
            cluster: true,
            clusterMaxZoom: 14, // Max zoom to cluster points on
            clusterRadius: 30
        });
    }

    async function initMap(container: HTMLDivElement) {
        // looks for 'window' at top level (ugh) so have to import dynamically
        const { default: MapboxCircle } = await import('mapbox-gl-circle');

        map = new mapboxgl.Map({
            container: container,
            style: themeToMapStyle($theme),
            center: defaultCenter,
            zoom: defaultZoom,
            bounds
        });
        map.addControl(new mapboxgl.NavigationControl());
        map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserHeading: true
            })
        );
        map.on('load', () => {
            addLocationsToMap(MapboxCircle, map, locations);
            addEntriesToMap(MapboxCircle, map, entries);
        });
    }

    function _map(container: HTMLDivElement) {
        initMap(container);
    }
</script>

<div use:_map class="w-full h-full overflow-hidden {className}"></div>

<style lang="scss">
    // hide mapbox feedback stuff
    :global(.mapboxgl-ctrl-bottom-right) {
        display: none;
    }

    :global(canvas) {
        overflow: hidden;
    }
</style>
