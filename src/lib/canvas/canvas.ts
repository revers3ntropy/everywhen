import { getContext, onMount } from "svelte";
import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import { now } from "../../routes/timeline/utils";

export const START_ZOOM = 1 / (60 * 60);

// Some props for the app
export const width = writable(browser ? window.innerWidth : 0);
export const height = writable(browser ? window.innerHeight : 0);
export const pixelRatio = writable(browser ? window.devicePixelRatio : 0);
export const ctx = writable();
export const canvas = writable();
export const time = writable(0);
export const cameraOffset = writable(0);
export const zoom = writable(START_ZOOM);

export class CtxProps {
    static c_Primary = "#DDD";
    static c_Text = "#FFF";
    static c_Secondary = "#CCC";

    readonly width: number;
    readonly height: number;
    readonly cameraOffset: number;
    readonly zoom: number;
    readonly ctx: CanvasRenderingContext2D;
    readonly canvas: HTMLCanvasElement;
    readonly pixelRatio: number;
    readonly time: number;

    public constructor (props: Required<CtxProps>) {
        this.width = props.width;
        this.height = props.height;
        this.cameraOffset = props.cameraOffset;
        this.zoom = props.zoom;
        this.ctx = props.ctx;
        this.canvas = props.canvas;
        this.pixelRatio = props.pixelRatio;
        this.time = props.time;
    }

    public get center (): number {
        return this.width / 2;
    }

    public get centerLnY (): number {
        return this.height * 3 / 4;
    }

    public zoomScaledPosition (pos: number, zoom?: number, center?: number): number {
        return (pos - this.center)
            * (zoom ?? this.zoom)
            + (center ?? this.center);
    }

    public timeToRenderPos (t: number): number {
        t = now() - t + this.cameraOffset;
        t = this.zoomScaledPosition(t, this.zoom, this.cameraOffset);
        return this.width - t;
    }

    public renderPosToTime (pos: number) {
        pos = this.zoomScaledPosition(
            this.width - pos,
            1 / this.zoom,
            this.cameraOffset
        );
        return Math.round(now() - pos - this.cameraOffset);
    }

    public getMousePosRaw (event: MouseEvent | TouchEvent): number {
        const rect = this.canvas.getBoundingClientRect();

        if (
            event.type === "touchstart" ||
            event.type === "touchmove" ||
            event.type === "touchend" ||
            event.type === "touchcancel"
        ) {
            const evt = (
                typeof (event as any).originalEvent === "undefined")
                ? event
                : (event as any).originalEvent;
            event = evt.touches[0] || evt.changedTouches[0];
        }

        return this.zoomScaledPosition(
            ((event as MouseEvent).pageX - rect.left) * this.canvas.width / rect.width,
            1 / this.zoom,
            this.width / 2
        );
    }

    getMouseYRaw (event: MouseEvent | TouchEvent): number {
        let rect = this.canvas.getBoundingClientRect();

        if (
            event.type === "touchstart" ||
            event.type === "touchmove" ||
            event.type === "touchend" ||
            event.type === "touchcancel"
        ) {
            const evt = (typeof (event as any).originalEvent === "undefined")
                ? event
                : (event as any).originalEvent;
            event = evt.touches[0] || evt.changedTouches[0];
        }

        return ((event as MouseEvent).pageY - rect.top) * this.canvas.height / rect.height;
    }

    public rect (
        x: number,
        y: number,
        w: number,
        h: number,
        colour = CtxProps.c_Primary
    ) {
        this.ctx.beginPath();
        this.ctx.fillStyle = colour;
        this.ctx.rect(x, y, w, h);
        this.ctx.fill();
    }

    text (txt: string, x: number, y: number, {
        c = CtxProps.c_Text,
        mWidth = undefined,
        align = "left",
        addToQ = true
    }: {
        c?: string,
        mWidth?: number,
        align?: CanvasTextAlign,
        addToQ?: boolean
    } = {}) {
        this.ctx.beginPath();
        this.ctx.textAlign = align;
        this.ctx.fillStyle = c;
        this.ctx.fillText(txt, x, y, mWidth);
        this.ctx.fill();
    }

    public circle (
        x: number,
        y: number,
        r: number,
        colour = CtxProps.c_Primary
    ) {
        this.ctx.beginPath();
        this.ctx.fillStyle = colour;
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    public centerLine () {
        this.rect(0, this.centerLnY - 1, this.width, 3);
    }
}

// A more convenient store for grabbing all game props
export const props = deriveObject({
    ctx,
    canvas,
    width,
    height,
    pixelRatio,
    time,
    cameraOffset,
    zoom
});

export const key = Symbol();

export type RenderCallback = (props: Readonly<CtxProps>, dt: number) => void;

export const renderable = (
    render?: RenderCallback
        | { render?: RenderCallback, setup?: RenderCallback }
) => {
    const api: any = getContext(key);
    const element = {
        ready: false,
        mounted: false
    } as any;

    if (typeof render === "function") {
        element.render = render;
    } else if (render) {
        if (render.render) {
            element.render = render.render;
        }
        if (render.setup) {
            console.log("setup");
            element.setup = render.setup;
        }
    }

    api.add(element);
    onMount(() => {
        element.mounted = true;
        return () => {
            api.remove(element);
            element.mounted = false;
        };
    });
};

function deriveObject (obj: any) {
    const keys = Object.keys(obj);
    const list = keys.map(key => {
        return obj[key];
    });
    return derived(list, (array) => {
        return array.reduce<any>((dict, value, i) => {
            dict[keys[i]] = value;
            return dict;
        }, {});
    });
}