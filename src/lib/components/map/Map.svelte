<script context="module" lang="ts">
    let id = 20;

    export function getId (): string {
        return (id++).toString();
    }
</script>

<script lang="ts">
    import type { MapBrowserEvent } from 'ol';
    import Map from 'ol/Map';
    import TileLayer from 'ol/layer/Tile';
    import View from 'ol/View';
    import OSM from 'ol/source/OSM';
    import Feature from 'ol/Feature';
    import SourceVector from 'ol/source/Vector';
    import LayerVector from 'ol/layer/Vector';
    import Point from 'ol/geom/Point';
    import Overlay from 'ol/Overlay';
    import { fromLonLat, toLonLat } from 'ol/proj';
    import type { EntryWithWordCount } from '../../../routes/stats/helpers';
    import type { Auth } from '../../controllers/user';
    import { popup } from '../../stores';
    import { showPopup } from '../../utils/popups';
    import EntryDialog from '../dialogs/EntryDialog.svelte';
    import EntryTooltipOnMap from './EntryTooltipOnMap.svelte';

    export let entries: EntryWithWordCount[] = [];
    export let auth: Auth;

    let mapId = getId();
    let map: Map | null = null;
    let tooltip: HTMLElement;
    let hoveringEntryId: string | null = null;
    let popupOnRight = false;
    let hoveringSomething = false;

    function closestEntryToCoords (
        entries: EntryWithWordCount[],
        lat: number,
        long: number,
    ): EntryWithWordCount | null {
        let closestEntry = null;
        let closestDistance = null;
        for (const entry of entries) {
            if (!entry.latitude || !entry.longitude) continue;
            const distance = Math.sqrt(
                Math.pow(entry.latitude - lat, 2)
                + Math.pow(entry.longitude - long, 2),
            );
            if (closestDistance === null || distance < closestDistance) {
                closestDistance = distance;
                closestEntry = entry;
            }
        }
        return closestEntry;
    }

    function lastEntry (entries: EntryWithWordCount[]): EntryWithWordCount | null {
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

    function setupMap (node: HTMLElement) {

        const osmLayer = new TileLayer({
            source: new OSM(),
        });

        const last = lastEntry(entries);
        const center = last && last.latitude && last.longitude
            ? fromLonLat([ last.longitude, last.latitude ])
            : [ 0, 0 ];

        map = new Map({
            target: node.id,
            layers: [
                osmLayer,
            ],
            view: new View({
                center,
                // zoom in if focused on last one, else go wide
                zoom: last ? 16 : 1,
            }),
        });

        map.addLayer(new LayerVector({
            source: new SourceVector({
                features: entries
                    .map(entry => (entry.latitude && entry.longitude)
                        ? new Feature({
                            name: entry.title,
                            geometry: new Point(fromLonLat([
                                entry.longitude,
                                entry.latitude,
                            ])),
                        })
                        : null,
                    )
                    .filter(Boolean),
            }),
        }));

        map.on('singleclick', (event: MapBrowserEvent<any>) => {
            if (!map) return;

            if (!map.hasFeatureAtPixel(event.pixel)) {
                popup.set(null);
                return;
            }
            const coordinate = event.coordinate;
            const [ long, lat ] = toLonLat(coordinate);

            const closestEntry = closestEntryToCoords(entries, lat, long);
            if (!closestEntry) return;

            showPopup(EntryDialog, {
                id: closestEntry.id,
                auth,
                obfuscated: false,
            });
        });

        map.addOverlay(new Overlay({
            element: tooltip,
            autoPan: true,
        }));

        map.on('pointermove', (event: MapBrowserEvent<any>) => {
            if (!map) return;

            if (!map.hasFeatureAtPixel(event.pixel)) {
                hoveringEntryId = null;
                hoveringSomething = false;
                return;
            }

            const coordinate = event.coordinate;
            const [ long, lat ] = toLonLat(coordinate);

            const closestEntry = closestEntryToCoords(entries, lat, long);
            if (!closestEntry) {
                hoveringEntryId = null;
                hoveringSomething = false;
                return;
            }

            hoveringSomething = true;

            const mapWidth = map.getSize()?.[0] || window.innerWidth;
            // never hides the hovered entry
            popupOnRight = event.pixel[0] < mapWidth / 2;
            hoveringEntryId = closestEntry.id;
        });

        return {
            destroy () {
                if (map) {
                    map.setTarget();
                    map = null;
                }
            },
        };
    }
</script>

<div class="map {hoveringSomething ? 'hovering' : ''}" id={mapId} use:setupMap>
    {#if hoveringEntryId !== null}
        <div
            bind:this={tooltip}
            class="ol-popup {popupOnRight ? 'right' : ''}"
        >
            <EntryTooltipOnMap {auth} id={hoveringEntryId} />
        </div>
    {/if}
</div>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';

    .map {
        .container();
        padding: 0;
        height: 80vh;
        margin: 0 0 0 1rem;
        width: calc(100vw - 5rem);
        border: none;
        position: relative;
        overflow: hidden;

        &.hovering {
            cursor: pointer;
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

        &, :global(*) {
            color: black;
        }

        &.right {
            left: auto;
            right: 0.5rem;
        }
    }
</style>