<script context="module" lang="ts">
    let id = 20;

    export function getId(): string {
        id++;
        return `${id}`;
    }
</script>

<script lang="ts">
    import 'ol-contextmenu/ol-contextmenu.css';
    import { notify } from '$lib/components/notifications/notifications';
    import MagnifyPlus from 'svelte-material-icons/MagnifyPlusOutline.svelte';
    import MagnifyMinus from 'svelte-material-icons/MagnifyMinusOutline.svelte';
    import Undo from 'svelte-material-icons/Undo.svelte';
    import CrosshairsGps from 'svelte-material-icons/CrosshairsGps.svelte';
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

        map = new Map({
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

    function withMap(node: HTMLElement) {
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

    function zoomToCurrentLocation() {
        navigator.geolocation.getCurrentPosition(
            position =>
                void map
                    .getView()
                    .setCenter(fromLonLat([position.coords.longitude, position.coords.latitude])),
            () => void notify.error('Could not get your current location')
        );
    }

    let initialLocation = value;
    let map: Map;
    let mapId = getId();
    let hoveringSomething = false;
    const eventDispatch = createEventDispatcher();
</script>

<div
    class="map rounded-t-xl"
    class:rounded-lg={roundedCorners}
    class:hovering={hoveringSomething}
    style="--width: {width}; --height: {height}; --mobile-width: {mobileWidth}; --mobile-height: {mobileHeight};"
    id="ol-map-{mapId}"
    use:withMap
>
    <div
        class="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center z-10 pointer-events-none"
    >
        .
    </div>
</div>
<div class="bg-lightAccent p-1 rounded-b-xl flex justify-between">
    <div>
        <button class="icon-gradient-on-hover" on:click={() => map.getView().adjustZoom(1.1)}>
            <MagnifyPlus size={24} />
        </button>
        <button class="icon-gradient-on-hover" on:click={() => map.getView().adjustZoom(0.9)}>
            <MagnifyMinus size={24} />
        </button>
    </div>
    <div>
        {#if (value[0] !== initialLocation[0] || value[1] !== initialLocation[1]) && initialLocation[0] !== null && initialLocation[1] !== null}
            <button
                class="icon-gradient-on-hover"
                on:click={() =>
                    // add check for null to avoid type error :/
                    initialLocation[0] !== null &&
                    map.getView().setCenter(fromLonLat(initialLocation))}
            >
                <Undo size={24} />
            </button>
        {/if}
        <button class="icon-gradient-on-hover" on:click={zoomToCurrentLocation}>
            <CrosshairsGps size={24} />
        </button>
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
