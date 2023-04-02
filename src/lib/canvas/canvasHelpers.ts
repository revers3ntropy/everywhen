import { browser } from '$app/environment';
import { getContext, onMount } from 'svelte';
import { writable } from 'svelte/store';
import { nowS } from '../utils/time';
import type { TimestampSecs } from "../utils/types";

export const START_ZOOM = 1 / (60 * 60);

type CanvasListener<T = MouseEvent & TouchEvent & WheelEvent> = (event: T) => void;

export interface ICanvasListeners {
    mousemove: CanvasListener[],
    mouseup: CanvasListener[],
    mousedown: CanvasListener[],
    touchstart: CanvasListener[],
    touchmove: CanvasListener[],
    touchend: CanvasListener[],
    wheel: CanvasListener[],
}

export interface ICanvasState extends ICanvasListeners {
    width: number,
    height: number,
    pixelRatio: number,
    ctx: null | CanvasRenderingContext2D,
    canvas: null | HTMLCanvasElement,
    time: number,
    cameraOffset: number,
    zoom: number
}

export class CanvasState implements ICanvasListeners {
    static c_Primary = '#DDD';
    static c_Text = '#FFF';
    static c_Secondary = '#CCC';
    width: number;
    height: number;
    cameraOffset: number;
    zoom: number;
    ctx: CanvasRenderingContext2D | null;
    canvas: HTMLCanvasElement | null;
    pixelRatio: number;
    time: number;
    readonly mousemove: CanvasListener[];
    readonly mouseup: CanvasListener[];
    readonly mousedown: CanvasListener[];
    readonly touchstart: CanvasListener[];
    readonly touchmove: CanvasListener[];
    readonly touchend: CanvasListener[];
    readonly wheel: CanvasListener[];

    public constructor (props: Required<CanvasState>) {
        this.width = props.width;
        this.height = props.height;
        this.cameraOffset = props.cameraOffset;
        this.zoom = props.zoom;
        this.ctx = props.ctx;
        this.canvas = props.canvas;
        this.pixelRatio = props.pixelRatio;
        this.time = props.time;

        this.mousemove = props.mousemove;
        this.mouseup = props.mouseup;
        this.mousedown = props.mousedown;
        this.touchstart = props.touchstart;
        this.touchmove = props.touchmove;
        this.touchend = props.touchend;
        this.wheel = props.wheel;
    }

    static empty (): CanvasState {
        return new CanvasState({
            width: browser ? window.innerWidth : 0,
            height: browser ? window.innerHeight : 0,
            pixelRatio: browser ? window.devicePixelRatio : 0,
            ctx: null,
            canvas: null,
            time: 0,
            cameraOffset: 0,
            zoom: START_ZOOM,

            mousemove: [],
            mouseup: [],
            mousedown: [],
            touchstart: [],
            touchmove: [],
            touchend: [],
            wheel: [],
        } as unknown as CanvasState);
    }

    public listen<EvtT extends keyof ICanvasListeners> (event: EvtT, callback: CanvasListener<WindowEventMap[EvtT]>) {
        this[event].push(callback);
    }

    public center (): number {
        return this.width / 2;
    }

    public centerLnY (): number {
        return this.height * 3 / 4;
    }

    public zoomScaledPosition (pos: number, zoom: number, center: number): number {
        return (pos - center) * zoom + center;
    }

    public timeToRenderPos (t: TimestampSecs): number {
        t -= new Date().getTimezoneOffset() * 60;
        t = nowS() - t + this.cameraOffset;
        t = this.zoomScaledPosition(t, this.zoom, this.cameraOffset);
        return this.width - t;
    }

    public dateToRenderPos (
        year: number,
        month = 0,
        date = 1,
        hour = 0,
        minute = 0,
        second = 0
    ): number {
        const t = new Date(year, month, date, hour, minute, second).getTime() / 1000;
        return this.timeToRenderPos(t);
    }

    public renderPosToTime (pos: number): TimestampSecs {
        pos = this.width - pos;
        pos = this.zoomScaledPosition(pos, 1 / this.zoom, this.cameraOffset);
        return Math.round(
            nowS()
            - pos
            + this.cameraOffset
            + new Date().getTimezoneOffset() * 60
        );
    }

    public getMousePosRaw (event: MouseEvent | TouchEvent): number {
        if (!this.canvas) throw new Error('Canvas not set');
        const rect = this.canvas.getBoundingClientRect();

        if (
            event.type === 'touchstart' ||
            event.type === 'touchmove' ||
            event.type === 'touchend' ||
            event.type === 'touchcancel'
        ) {
            const evt = (
                typeof (event as any).originalEvent === 'undefined')
                ? event
                : (event as any).originalEvent;
            event = evt.touches[0] || evt.changedTouches[0];
        }

        return this.zoomScaledPosition(
            ((event as MouseEvent).pageX - rect.left) * this.canvas.width / rect.width,
            1 / this.zoom,
            this.width / 2,
        );
    }

    public getMouseYRaw (event: MouseEvent | TouchEvent): number {
        if (!this.canvas) throw new Error('Canvas not set');
        let rect = this.canvas.getBoundingClientRect();

        if (
            event.type === 'touchstart' ||
            event.type === 'touchmove' ||
            event.type === 'touchend' ||
            event.type === 'touchcancel'
        ) {
            const evt = (typeof (event as any).originalEvent === 'undefined')
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
        {
            radius = 0,
            colour = CanvasState.c_Primary,
        } = {},
    ) {
        if (!this.ctx) throw new Error('Canvas not set');
        this.ctx.beginPath();
        this.ctx.fillStyle = colour;
        this.ctx.roundRect(x, y, w, h, radius);
        this.ctx.fill();
    }

    public text (txt: string, x: number, y: number, {
        c = CanvasState.c_Text,
        maxWidth = undefined,
        align = 'left',
    }: {
        c?: string,
        maxWidth?: number,
        align?: CanvasTextAlign
    } = {}) {
        if (!this.ctx) throw new Error('Canvas not set');
        this.ctx.beginPath();
        this.ctx.textAlign = align;
        this.ctx.fillStyle = c;
        this.ctx.fillText(txt, x, y, maxWidth);
        this.ctx.fill();
    }

    public circle (
        x: number,
        y: number,
        r: number,
        colour = CanvasState.c_Primary,
    ) {
        if (!this.ctx) throw new Error('Canvas not set');
        this.ctx.beginPath();
        this.ctx.fillStyle = colour;
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.fill();
    }
}

export const canvasState = writable(CanvasState.empty());
export const key = Symbol();

export type RenderProps = Omit<Readonly<CanvasState>, 'ctx'> & {
    ctx: CanvasRenderingContext2D
};
export type RenderCallback = (props: RenderProps, dt: number) => void | Promise<void>;

export const renderable = (
    render?: RenderCallback
             | { render?: RenderCallback, setup?: RenderCallback },
) => {
    const api: any = getContext(key);
    const element = {
        ready: false,
        mounted: false,
    } as any;

    if (typeof render === 'function') {
        element.render = render;
    } else if (render) {
        if (render.render) {
            element.render = render.render;
        }
        if (render.setup) {
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