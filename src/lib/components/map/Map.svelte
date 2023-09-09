<script context="module" lang="ts">
    let id = 20;

    export function getId(): string {
        id++;
        return `${id}`;
    }
</script>

<script lang="ts">
    import type { FeatureLike } from 'ol/Feature';
    import { writable } from 'svelte/store';
    import type { EntryAsLocation } from '$lib/controllers/entry/entry';
    import type { CallbackObject } from 'ol-contextmenu/dist/types';
    import type { MapBrowserEvent } from 'ol';
    import Map from 'ol/Map';
    import TileLayer from 'ol/layer/Tile';
    import View from 'ol/View';
    import OSM from 'ol/source/OSM';
    import Overlay from 'ol/Overlay';
    import { fromLonLat, toLonLat } from 'ol/proj';
    import ContextMenu from 'ol-contextmenu';
    import { Location } from '$lib/controllers/location/location';
    import { popup, settingsStore } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { showPopup } from '$lib/utils/popups';
    import type { Degrees, Meters } from '../../../types';
    import EditLocation from '../location/EditLocation.svelte';
    import EntryDialog from '$lib/components/dialogs/EntryDialog.svelte';
    import EntryTooltipOnMap from './EntryTooltipOnMap.svelte';
    import { notify } from '$lib/components/notifications/notifications';
    import {
        type EntryFeature,
        lastEntry,
        type LocationFeature,
        olEntryBezierArrows,
        olLayerFromEntries,
        olLayerFromLocations
    } from './map';

    // https://openlayers.org/

    export let entries = [] as EntryAsLocation[];
    export let locations = [] as Location[];
    export let entriesInteractable = true;
    export let width = '100%';
    export let height = 'calc(100vh - 1rem)';
    export let mobileWidth = '100%';
    export let mobileHeight = 'calc(100vh - 5rem)';

    async function reloadLocations() {
        const res = notify.onErr(await api.get('/locations'));
        locations = res.locations;
    }

    async function syncLocationInBackground(
        id: string,
        latitude: number,
        longitude: number,
        radius: number
    ): Promise<void> {
        notify.onErr(
            await api.put(apiPath('/locations/?', id), {
                latitude,
                longitude,
                radius
            })
        );
    }

    async function addNamedLocation(object: CallbackObject) {
        const coordinate = object.coordinate;
        const [long, lat] = toLonLat(coordinate);

        notify.onErr(
            await api.post('/locations', {
                latitude: lat,
                longitude: long,
                name: 'New Location',
                radius: Location.metersToDegrees(50)
            })
        );

        await reloadLocations();
    }

    function sortFeatures(features: (LocationFeature | EntryFeature | FeatureLike)[]) {
        return features
            .filter((feature): feature is LocationFeature | EntryFeature => {
                // only locations and entries are clickable
                if ('entry' in feature) {
                    return entriesInteractable;
                }
                return 'location' in feature;
            })
            .sort((a, b) => {
                // pick entries over locations
                if ('entry' in a && 'entry' in b) {
                    return 0;
                }
                if ('entry' in a) {
                    return -1;
                }
                return 1;
            })
            .sort((a, b) => {
                if (!('location' in a) || !('location' in b)) {
                    return 0;
                }
                // pick smaller locations over larger ones
                return a.location.radius - b.location.radius;
            });
    }

    function pushToLocationChangeQueue(
        id: string,
        latitude: Degrees,
        longitude: Degrees,
        radius: Meters
    ): void {
        locationChangeQueue[id] ??= [];
        locationChangeQueue[id].push({
            latitude,
            longitude,
            radius
        });
    }

    function setupMap(
        node: HTMLElement,
        {
            locations,
            entries
        }: {
            locations: Location[];
            entries: EntryAsLocation[];
        }
    ): Map {
        const osmLayer = new TileLayer({
            source: new OSM()
        });

        const last = lastEntry(entries);

        let center = [0, 0];
        if ($mapCenter) {
            center = $mapCenter;
        } else if (last && last.latitude && last.longitude) {
            center = fromLonLat([last.longitude, last.latitude]);
        }

        let zoom = 1;
        if ($mapZoom) {
            zoom = $mapZoom;
        } else if (last) {
            // zoom in if focused on last one, else go wide
            zoom = 19;
        }

        const map = new Map({
            target: node.id,
            layers: [osmLayer],
            view: new View({ center, zoom })
        });

        const { layer, interactions } = olLayerFromLocations(
            locations,
            map.getView(),
            pushToLocationChangeQueue
        );
        map.addLayer(layer);
        interactions.map(i => map.addInteraction(i));

        map.addLayer(olLayerFromEntries(entries));
        if ($settingsStore.showArrowsBetweenEntriesOnMap.value) {
            map.addLayer(olEntryBezierArrows(entries, map.getView()));
        }

        map.on('singleclick', (event: MapBrowserEvent<UIEvent>) => {
            if (!map) return;

            let features = map.getFeaturesAtPixel(event.pixel);

            if (features.length < 1) {
                popup.set(null);
                return;
            }

            features = sortFeatures(features);

            if (features.length < 1) {
                return;
            }

            const hovering = features[0] as EntryFeature | LocationFeature;

            if ('entry' in hovering) {
                showPopup(EntryDialog, {
                    id: hovering.entry.id,
                    obfuscated: false
                });
                return;
            }

            if ('location' in hovering) {
                showPopup(EditLocation, {
                    ...hovering.location,
                    onChange: reloadLocations,
                    isInDialog: true
                });
            }
        });

        map.addControl(
            new ContextMenu({
                width: 180,
                items: [
                    {
                        text: 'Add Named Location',
                        classname: 'context-menu-option',
                        callback: (o: CallbackObject) => void addNamedLocation(o)
                    }
                ]
            })
        );

        map.addOverlay(
            new Overlay({
                element: tooltip,
                autoPan: true
            })
        );

        map.on('pointermove', (event: MapBrowserEvent<UIEvent>) => {
            if (!map) return;

            const features = sortFeatures(map.getFeaturesAtPixel(event.pixel));

            if (!features.length) {
                hoveringEntryId = null;
                hoveringSomething = false;
                return;
            }

            const hovering = features[0];

            if (!entriesInteractable && 'entry' in hovering) {
                hoveringEntryId = null;
                hoveringSomething = false;
                return;
            }

            hoveringSomething = true;

            if (!('entry' in hovering)) {
                hoveringEntryId = null;
                return;
            }

            const mapWidth = map.getSize()?.[0] || window.innerWidth;
            // never hides the hovered entry
            popupOnRight = event.pixel[0] < mapWidth / 2;
            hoveringEntryId = hovering.entry.id;
        });

        // save the map view
        map.on('postrender', () => {
            const view = map.getView();
            mapZoom.set(view.getZoom());
            mapCenter.set(view.getCenter());
        });

        return map;
    }

    function map(
        node: HTMLElement,
        { locations, entries }: { locations: Location[]; entries: EntryAsLocation[] }
    ) {
        let map = setupMap(node, { locations, entries });
        return {
            destroy() {
                map.setTarget(undefined as unknown as HTMLElement);
            },
            update(props: { locations: Location[]; entries: EntryAsLocation[] }) {
                map.setTarget(undefined as unknown as HTMLElement);
                map = setupMap(node, props);
            }
        };
    }

    let mapId = getId();
    let tooltip: HTMLElement;
    let hoveringEntryId: string | null = null;
    let popupOnRight = false;
    let hoveringSomething = false;
    let mapZoom = writable<number | undefined>(undefined);
    let mapCenter = writable<number[] | undefined>(undefined);

    let locationChangeQueue: Record<
        string,
        {
            radius: number;
            latitude: number;
            longitude: number;
        }[]
    > = {};

    setInterval(() => {
        for (const [id, changes] of Object.entries(locationChangeQueue)) {
            const last = changes[changes.length - 1];
            void syncLocationInBackground(id, last.latitude, last.longitude, last.radius);
        }
        locationChangeQueue = {};
    }, 500);
</script>

<div
    class="map"
    class:hovering={hoveringSomething}
    style="--width: {width}; --height: {height}; --mobile-width: {mobileWidth}; --mobile-height: {mobileHeight};"
    id="ol-map-{mapId}"
    use:map={{ locations, entries }}
>
    {#if hoveringEntryId !== null}
        <div bind:this={tooltip} class="ol-popup {popupOnRight ? 'right' : ''}">
            <EntryTooltipOnMap id={hoveringEntryId} />
        </div>
    {/if}
</div>

<style lang="scss">
    @import 'ol-contextmenu/ol-contextmenu.css';

    @import '$lib/styles/layout';

    .map {
        @extend .container;
        padding: 0;
        margin: 0;
        border: none;
        position: relative;
        overflow: hidden;

        width: var(--width);
        height: var(--height);

        @media #{$mobile} {
            width: var(--mobile-width);
            height: var(--mobile-height);
            padding: 0;
            margin: 0;
        }

        &.hovering {
            cursor: pointer;
        }

        & :global(*) {
            color: black;
        }

        :global(.context-menu-option),
        :global(.ol-ctx-menu-zoom-in),
        :global(.ol-ctx-menu-zoom-out) {
            margin: 0;

            &:hover {
                background: #f0f0f0;
            }
        }

        :global(.ol-attribution) {
            // sorry but it's really messy :/
            display: none;
        }
    }

    .ol-popup {
        z-index: 10;
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        background: rgba(255, 255, 255, 0.4);
        backdrop-filter: blur(5px);
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        pointer-events: none;

        &,
        :global(*) {
            color: black;
        }

        &.right {
            left: auto;
            right: 0.5rem;
        }
    }
</style>
