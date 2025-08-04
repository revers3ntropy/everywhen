<script lang="ts">
    import mapboxgl, { type LngLatBoundsLike, type LngLatLike } from 'mapbox-gl';
    import type { Map } from 'mapbox-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';
    // this module can't be SSR'ed so can only import as type
    import type MapboxCircle from 'mapbox-gl-circle';
    import * as Dialog from '$lib/components/ui/dialog';
    import { theme } from '$lib/stores';
    import { Theme } from '$lib/constants';
    import { Location } from '$lib/controllers/location/location';
    import { notify } from '$lib/components/notifications/notifications';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import type { Meters, Degrees } from '../../../types';
    import EditLocation from '$lib/components/location/EditLocation.svelte';
    import EntryDialog from '$lib/components/entry/EntryDialog.svelte';
    import type { Label } from '$lib/controllers/label/label';
    import { CSLogger } from '$lib/controllers/logs/logger.client';

    // default to the UK :)
    export let defaultCenter: LngLatLike = { lat: -4, lng: 53 };
    export let defaultZoom = 4;
    export let bounds: LngLatBoundsLike | undefined = undefined;

    export let locations: Location[] = [];
    export let entries: { id: string; latitude: Degrees; longitude: Degrees }[] = [];
    export let labels: Record<string, Label> = {};

    export let locationsAreEditable = false;
    export let entriesInteractable = true;

    let className: string | undefined = undefined;
    export { className as class };

    // https://docs.mapbox.com/help/glossary/access-token/
    mapboxgl.accessToken =
        'pk.eyJ1IjoicmV2ZXJzM250cm9weSIsImEiOiJja3NxNmhjZ3EwOXZpMnFvM2Znd3puZmZyIn0.og-Btcduk-VzD4XAEsuZcQ';

    let map: Map;

    let locationForDialog: Location | null = null;
    let entryIdForDialog: string | null = null;

    theme.subscribe(newTheme => {
        // update map when theme changes
        if (map) map.setStyle(themeToMapStyle(newTheme));
    });

    $: updateEntriesSourceData(entries);

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

    function addLocationsToMap(
        _MapboxCircle: typeof MapboxCircle,
        map: Map,
        locations: Location[]
    ) {
        for (const location of locations) {
            const radius: Meters = Location.degreesToMeters(location.radius);
            if (!radius) {
                void CSLogger.error('no radius', { location, radius });
                notify.error('Failed to load location');
                continue;
            }
            const locationCircle = new _MapboxCircle(
                { lat: location.latitude, lng: location.longitude },
                Math.max(1, radius),
                {
                    editable: locationsAreEditable,
                    fillColor: 'rgba(255, 0, 200, 0.1)',
                    refineStroke: true
                }
            ).addTo(map);

            locationCircle.on('click', () => {
                locationForDialog = location;
            });

            if (!locationsAreEditable) continue;

            locationCircle.on('centerchanged', circle => {
                updateLocationCenter(location.id, circle.getCenter());
            });
            locationCircle.on('radiuschanged', circle => {
                updateLocationRadius(location.id, Location.metersToDegrees(circle.getRadius()));
            });
        }
    }

    function updateEntriesSourceData(
        entries: { id: string; latitude: Degrees; longitude: Degrees }[]
    ) {
        if (!map) return;
        // not sure why the types don't like a bunch of stuff (have to do similar casts below too)
        // the docs show this is fine and it works
        (map.getSource('entries')! as { setData: (data: unknown) => void }).setData({
            type: 'FeatureCollection',
            features: entries.map(e => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [e.longitude, e.latitude]
                },
                properties: { entryId: e.id }
            }))
        });
    }

    function addEntriesToMap(
        _MapboxCircle: typeof MapboxCircle,
        map: Map,
        entries: { id: string; latitude: Degrees; longitude: Degrees }[]
    ) {
        // example cluster implementation
        // https://docs.mapbox.com/mapbox-gl-js/example/cluster/
        map.addSource('entries', {
            type: 'geojson',
            generateId: true,
            data: {
                type: 'FeatureCollection',
                features: []
            },
            cluster: true,
            clusterMaxZoom: 14, // Max zoom to cluster points on
            clusterRadius: 50
        });

        updateEntriesSourceData(entries);

        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'entries',
            filter: ['has', 'point_count'],
            paint: {
                // Use step expressions (https://docs.mapbox.com/style-spec/reference/expressions/#step)
                // with three steps to implement three types of circles:
                //   * Blue, 20px circles when point count is less than 100
                //   * Yellow, 30px circles when point count is between 100 and 750
                //   * Pink, 40px circles when point count is greater than or equal to 750
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6',
                    100,
                    '#f1f075',
                    750,
                    '#f28cb1'
                ],
                'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
                'circle-emissive-strength': 1
            }
        });

        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'entries',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': ['get', 'point_count_abbreviated'],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            }
        });

        map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'entries',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': '#11b4da',
                'circle-radius': 4,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff',
                'circle-emissive-strength': 1
            }
        });

        // inspect a cluster on click
        map.addInteraction('click-clusters', {
            type: 'click',
            target: { layerId: 'clusters' },
            handler: e => {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: ['clusters']
                });
                (
                    map.getSource('entries')! as unknown as {
                        getClusterExpansionZoom: (
                            clusterId: string,
                            cb: (err: unknown, zoom: number) => void
                        ) => void;
                    }
                ).getClusterExpansionZoom(
                    (features[0]!.properties! as unknown as { cluster_id: string }).cluster_id,
                    (err, zoom) => {
                        if (err) return;

                        map.easeTo({
                            center: (features[0].geometry as unknown as { coordinates: LngLatLike })
                                .coordinates,
                            zoom
                        });
                    }
                );
            }
        });

        // Change the cursor to a pointer when the mouse is over a cluster of POIs.
        map.addInteraction('clusters-mouseenter', {
            type: 'mouseenter',
            target: { layerId: 'clusters' },
            handler: () => {
                map.getCanvas().style.cursor = 'pointer';
            }
        });

        // Change the cursor back to a pointer when it stops hovering over a cluster of POIs.
        map.addInteraction('clusters-mouseleave', {
            type: 'mouseleave',
            target: { layerId: 'clusters' },
            handler: () => {
                map.getCanvas().style.cursor = '';
            }
        });

        // Change the cursor to a pointer when the mouse is over an individual POI.
        map.addInteraction('unclustered-mouseenter', {
            type: 'mouseenter',
            target: { layerId: 'unclustered-point' },
            handler: () => {
                map.getCanvas().style.cursor = 'pointer';
            }
        });

        // Change the cursor back to a pointer when it stops hovering over an individual POI.
        map.addInteraction('unclustered-mouseleave', {
            type: 'mouseleave',
            target: { layerId: 'unclustered-point' },
            handler: () => {
                map.getCanvas().style.cursor = '';
            }
        });

        if (entriesInteractable)
            map.addInteraction('unclustered-click', {
                type: 'mouseleave',
                target: { layerId: 'unclustered-point' },
                handler: evt => {
                    entryIdForDialog = (evt.feature!.properties as { entryId: string }).entryId;
                }
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

<div use:_map class="w-full h-full overflow-hidden {className}" />

<Dialog.Root open={!!entryIdForDialog}>
    <Dialog.Content>
        {#if entryIdForDialog}
            <EntryDialog id={entryIdForDialog} obfuscated={false} {locations} {labels} />
        {:else}
            <p> Something went wrong </p>
        {/if}
    </Dialog.Content>
</Dialog.Root>
<Dialog.Root open={!!locationForDialog}>
    <Dialog.Content>
        {#if locationForDialog}
            <EditLocation {...locationForDialog} isInDialog />
        {:else}
            <p> Something went wrong </p>
        {/if}
    </Dialog.Content>
</Dialog.Root>

<style lang="scss">
    // hide mapbox feedback stuff
    :global(.mapboxgl-ctrl-bottom-right) {
        display: none;
    }

    :global(canvas) {
        overflow: hidden;
    }
</style>
