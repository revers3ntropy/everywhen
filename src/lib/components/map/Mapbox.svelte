<script lang="ts">
    import mapboxgl from 'mapbox-gl';
    import type { Map } from 'mapbox-gl';
    import { theme } from '$lib/stores';
    import { Theme } from '$lib/constants';
    import { Location } from '$lib/controllers/location/location';
    import { notify } from '$lib/components/notifications/notifications';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import type { Meters, Degrees } from "../../../types";

    // Default to look at the UK :)
    export let defaultCenter: [number, number] = [-4, 53];
    export let defaultZoom = 4;
    export let locations: Location[] = [];
    export let locationsAreEditable = false;

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

    async function initMap(container: HTMLDivElement) {
        // looks for 'window' at top level (ugh) so have to import dynamically
        const { default: MapboxCircle } = await import('mapbox-gl-circle');

        map = new mapboxgl.Map({
            container: container,
            style: themeToMapStyle($theme),
            center: defaultCenter,
            zoom: defaultZoom
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
            for (const location of locations) {
                const myCircle = new MapboxCircle(
                    { lat: location.latitude, lng: location.longitude },
                    Location.degreesToMeters(location.radius),
                    {
                        editable: locationsAreEditable,
                        fillColor: 'rgba(255, 0, 200, 0.1)',
                        refineStroke: true
                    }
                ).addTo(map);
                if (!locationsAreEditable) continue;

                myCircle.on(
                    'centerchanged',
                    (circleObj: { getCenter: () => { lat: number; lng: number } }) => {
                        updateLocationCenter(location.id, circleObj.getCenter());
                    }
                );
                myCircle.on('radiuschanged', (circleObj: { getRadius: () => number }) => {
                    updateLocationRadius(location.id, Location.metersToDegrees(circleObj.getRadius()));
                });
            }
        });
    }

    function _map(container: HTMLDivElement) {
        initMap(container);
    }
</script>

<div use:_map class="w-full h-full overflow-hidden"></div>

<style lang="scss">
    // hide mapbox feedback stuff
    :global(.mapboxgl-ctrl-bottom-right) {
        display: none;
    }

    :global(canvas) {
      overflow: hidden;
    }
</style>
