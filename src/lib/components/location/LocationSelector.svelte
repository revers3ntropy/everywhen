<script context="module" lang="ts">
    let id = 20;

    export function getId(): string {
        id++;
        return `${id}`;
    }
</script>

<script lang="ts">
    import 'ol-contextmenu/ol-contextmenu.css';
    import Map from 'ol/Map';
    import TileLayer from 'ol/layer/Tile';
    import View from 'ol/View';
    import OSM from 'ol/source/OSM';
    import { fromLonLat, toLonLat } from 'ol/proj';
    import { createEventDispatcher } from 'svelte';

    // https://openlayers.org/

    export let value: [number, number] | [null, null] = [null, null];
    export let width = '100%';
    export let height = '100vh';
    export let mobileWidth = '100%';
    export let mobileHeight = '100vh';
    export let roundedCorners = false;

    function setupMap(node: HTMLElement): Map {
        const osmLayer = new TileLayer({
            source: new OSM()
        });

        let center = [0, 0];
        let hasValue = false;
        if (value[0] !== null && value[1] !== null) {
            center = fromLonLat(value);
            hasValue = true;
        }

        let zoom = 1;
        if (hasValue) {
            // zoom in if focused on last one, else go wide
            zoom = 15;
        }

        const map = new Map({
            target: node.id,
            layers: [osmLayer],
            view: new View({ center, zoom })
        });

        // update the value when the user moves the map
        map.on('moveend', () => {
            const view = map.getView();
            const center = view.getCenter();
            const lonLat = toLonLat(center ? center : [0, 0]);
            if (lonLat[0] === value[0] && lonLat[1] === value[1]) return;
            if (lonLat[0] === 0 && lonLat[1] === 0) return;
            value = [lonLat[0], lonLat[1]];
            eventDispatch('change', [lonLat[0], lonLat[1]]);
        });

        return map;
    }

    function map(node: HTMLElement) {
        let map = setupMap(node);
        return {
            destroy() {
                map.setTarget(undefined as unknown as HTMLElement);
            },
            update() {
                map.setTarget(undefined as unknown as HTMLElement);
                map = setupMap(node);
            }
        };
    }

    let mapId = getId();
    let hoveringSomething = false;
    const eventDispatch = createEventDispatcher();
</script>

<div
    class="map"
    class:rounded-lg={roundedCorners}
    class:hovering={hoveringSomething}
    style="--width: {width}; --height: {height}; --mobile-width: {mobileWidth}; --mobile-height: {mobileHeight};"
    id="ol-map-{mapId}"
    use:map
>
    <div
        class="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center z-10 pointer-events-none"
    >
        .
    </div>
</div>

<style lang="scss">
    @import '$lib/styles/layout';

    .map {
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
        :global(.ol-zoom-in),
        :global(.ol-zoom-out),
        :global(.ol-compass),
        :global(.ol-attribution) {
            display: none;
        }
    }
</style>
